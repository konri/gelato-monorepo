import { Typography } from '@/components/atoms/Typography';
import { ConfirmSheet } from '@/components/molecules/ConfirmSheet';
import { BrandRewardsList } from '@/components/molecules/Scan/BrandRewardsList';
import { CustomerLoyaltyCard } from '@/components/molecules/Scan/CustomerLoyaltyCard';
import { ExchangeRewardList } from '@/components/molecules/Scan/ExchangeRewardList';
import { HandOverRewardList } from '@/components/molecules/Scan/HandOverRewardList';
import { PromotionBanner } from '@/components/molecules/Scan/PromotionBanner';
import { useActiveSpot } from '@/hooks/useActiveSpot';
import { useRole } from '@/hooks/useRole';
import { spotStore } from '@/stores/spotStore';
import { isConnectionError, isDefinitiveRejection, messageForError } from '@/utils/errorCodes';
import { applyMultiplier, formatMultiplier, localText } from '@/utils/loyaltyDisplay';
import { counterActionKey, pendingRequestIds } from '@/utils/requestId';
import {
  awardLoyaltyPoints,
  createPointTemplate,
  deletePointTemplate,
  exchangeRewardAtCounter,
  getBrandPrizes,
  getPointTemplates,
  handOverReward,
  staffScan,
  type BrandReward,
  type CustomerReward,
  type GraphQLError,
  type LoyaltyCard,
  type PointTemplate,
  type StaffAwardResult,
  type StaffScanResult,
} from '@repo/api-client';
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, TextInput, View } from 'react-native';

const MAX_QUANTITY = 99;

type Notice = { tone: 'success' | 'info'; text: string };

/**
 * The customer screen after a card scan (BRANDS_SPEC §4.8, A3): the points at
 * THIS brand, rewards to hand over, adding points (templates × quantity, with
 * the promotion multiplier; custom points for spot admins and up, capped),
 * and exchanging points for a reward at the counter.
 *
 * Every number comes from the server; the multiplier preview mirrors its
 * rule (floor(base × percent / 100)). Awards and exchanges carry a requestId
 * kept outside this screen (utils/requestId), so a retry after a timeout, a
 * cancel, a rescan or an app restart never adds or spends twice.
 *
 * Cancel works while a request runs (a stalled connection never locks the
 * screen); the late answer of an abandoned attempt is ignored.
 */
export function LoyaltyAward({
  scan,
  spotId,
  onDone,
}: {
  /** A CUSTOMER scan with its card. */
  scan: StaffScanResult & { customer: LoyaltyCard };
  spotId: string;
  onDone: () => void;
}) {
  const { t, i18n } = useTranslation();
  const { can } = useRole();
  const { activeSpot } = useActiveSpot();

  const [card, setCard] = useState<LoyaltyCard>(scan.customer);
  const [templates, setTemplates] = useState<PointTemplate[]>([]);
  const [templatesStatus, setTemplatesStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [brandRewards, setBrandRewards] = useState<BrandReward[]>([]);

  const [selected, setSelected] = useState<PointTemplate | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [custom, setCustom] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [awarded, setAwarded] = useState<StaffAwardResult | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [managing, setManaging] = useState(false);

  const [exchangeTarget, setExchangeTarget] = useState<BrandReward | null>(null);
  const [exchangeBusy, setExchangeBusy] = useState(false);
  const [exchangeError, setExchangeError] = useState<string | null>(null);

  const [handOverTarget, setHandOverTarget] = useState<CustomerReward | null>(null);
  const [handOverBusy, setHandOverBusy] = useState(false);
  const [handOverError, setHandOverError] = useState<string | null>(null);

  // Each request remembers its attempt; Cancel / unmount moves on, so a late
  // answer of an abandoned attempt changes nothing.
  const mounted = useRef(true);
  const awardAttempt = useRef(0);
  const exchangeAttempt = useRef(0);
  const handOverAttempt = useRef(0);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  // An inactive brand or spot pauses points and exchanges. Rewards already
  // claimed stay redeemable for a while after a brand is paused (the server's
  // readyRewards already says which), but never at an inactive spot.
  const reason = scan.reason ?? null;
  const loyaltyPaused = reason === 'BRAND_INACTIVE' || reason === 'SPOT_INACTIVE';
  const handOverPaused = reason === 'SPOT_INACTIVE';

  const brandName = card.brandName || activeSpot?.brandName || '';
  const customerName = card.name?.trim() || t('Scan.customer');
  const cap = activeSpot?.manualAwardCap ?? null;
  const showCustom = can.awardCustom && cap !== 0;
  const multiplier = card.activeMultiplierPercent && card.activeMultiplierPercent > 100 ? card.activeMultiplierPercent : 100;

  // A response that lands after a spot switch belongs to the old spot.
  const stale = useCallback(() => spotStore.getActiveSpotId() !== spotId, [spotId]);

  const loadTemplates = useCallback(async () => {
    setTemplatesStatus('loading');
    const res = await getPointTemplates(spotId, { silent: true });
    if (!mounted.current || stale()) return;
    if (!res.success || !res.data) {
      setTemplatesStatus('error');
      return;
    }
    setTemplates(res.data.filter((tpl) => tpl.isActive));
    setTemplatesStatus('ready');
  }, [spotId, stale]);

  useEffect(() => {
    void loadTemplates();
  }, [loadTemplates]);

  useEffect(() => {
    if (!card.brandId) return;
    let cancelled = false;
    void getBrandPrizes(card.brandId, { silent: true }).then((res) => {
      if (!cancelled && !stale()) setBrandRewards(res.data ?? []);
    });
    return () => {
      cancelled = true;
    };
  }, [card.brandId, stale]);

  /** Re-read the card (balance, rewards ready, rewards affordable) after a change. */
  const refreshCard = useCallback(async () => {
    const res = await staffScan(spotId, card.loyaltyCode || card.id, { silent: true });
    if (stale()) return;
    if (res.data?.kind === 'CUSTOMER' && res.data.customer) setCard(res.data.customer);
  }, [spotId, card.loyaltyCode, card.id, stale]);

  const customPoints = selected ? 0 : parseInt(custom, 10) || 0;
  const basePoints = selected ? selected.points * quantity : customPoints;
  const points = selected ? applyMultiplier(basePoints, multiplier) : customPoints;
  const overCap = !selected && cap != null && customPoints > cap;
  const canAward = !loyaltyPaused && !busy && points > 0 && !overCap;
  const m = formatMultiplier(multiplier, i18n.language);

  const awardErrorText = (err: GraphQLError | null): string => {
    if (isConnectionError(err)) return t('Scan.awardRetry');
    if (err?.code === 'AWARD_LIMIT_EXCEEDED') {
      const ext = (err.extensions ?? {}) as { cap?: unknown; kind?: unknown };
      const limit = typeof ext.cap === 'number' ? ext.cap : null;
      if (limit != null) {
        return ext.kind === 'DAILY' ? t('Scan.limitDaily', { count: limit }) : t('Scan.limitPerAward', { count: limit });
      }
    }
    return messageForError(err, t('Scan.awardError'));
  };

  const award = async () => {
    if (!canAward) return;
    // Same spot + customer + selection = same requestId until the outcome is
    // known, so a retry after a timeout is recorded once. A new selection gets
    // a new key.
    const selection = selected ? `tpl:${selected.id}:${quantity}` : `custom:${customPoints}:${note.trim()}`;
    const key = counterActionKey(spotId, card.id, 'award', selection);
    const attempt = ++awardAttempt.current;
    setBusy(true);
    setError(null);
    setNotice(null);
    const requestId = await pendingRequestIds.acquire(key);
    const res = await awardLoyaltyPoints(
      selected
        ? { spotId, customer: card.id, templateId: selected.id, quantity, requestId }
        : { spotId, customer: card.id, points: customPoints, description: note.trim() || undefined, requestId },
      { silent: true },
    );
    // Abandoned (Cancel, rescan, spot switch): the key stays for the retry.
    if (!mounted.current || attempt !== awardAttempt.current || stale()) return;
    setBusy(false);
    if (res.error || !res.data) {
      if (isDefinitiveRejection(res.error)) pendingRequestIds.settle(key, requestId);
      setError(awardErrorText(res.error));
      return;
    }
    pendingRequestIds.settle(key, requestId);
    const result = res.data;
    setAwarded(result);
    setCard((c) => ({ ...c, availablePoints: result.brandAvailablePoints }));
    setSelected(null);
    setQuantity(1);
    setCustom('');
    setNote('');
    void refreshCard();
  };

  const exchangeErrorText = (err: GraphQLError | null): string => {
    if (isConnectionError(err)) return t('Scan.exchangeRetry');
    const ext = (err?.extensions ?? {}) as { missingPoints?: unknown; reason?: unknown };
    if (err?.code === 'INSUFFICIENT_POINTS' && typeof ext.missingPoints === 'number') {
      return t('Scan.exchangeMissing', { count: ext.missingPoints });
    }
    if (err?.code === 'REWARD_UNAVAILABLE' && ext.reason === 'OUT_OF_STOCK') return t('Scan.rewardOutOfStockError');
    if (err?.code === 'SELF_AWARD') return t('Scan.selfExchange');
    return messageForError(err, t('Scan.exchangeError'));
  };

  const confirmExchange = async () => {
    const prize = exchangeTarget;
    if (!prize || exchangeBusy) return;
    const key = counterActionKey(spotId, card.id, 'exchange', prize.id);
    const attempt = ++exchangeAttempt.current;
    setExchangeBusy(true);
    setExchangeError(null);
    const requestId = await pendingRequestIds.acquire(key);
    const res = await exchangeRewardAtCounter(
      { spotId, customerId: card.id, prizeId: prize.id, requestId },
      { silent: true },
    );
    // Abandoned (Cancel, rescan, spot switch): the key stays for the retry.
    if (!mounted.current || attempt !== exchangeAttempt.current || stale()) return;
    setExchangeBusy(false);
    if (res.error || !res.data) {
      if (isDefinitiveRejection(res.error)) pendingRequestIds.settle(key, requestId);
      setExchangeError(exchangeErrorText(res.error));
      // The balance or the stock changed under us: show the current list.
      if (res.error?.code === 'INSUFFICIENT_POINTS' || res.error?.code === 'REWARD_UNAVAILABLE') void refreshCard();
      return;
    }
    pendingRequestIds.settle(key, requestId);
    const result = res.data;
    setExchangeTarget(null);
    if (result.customer) setCard(result.customer);
    else setCard((c) => ({ ...c, availablePoints: result.brandAvailablePoints }));
    const title = localText(prize.title, prize.titleLocal, i18n.language);
    setNotice({
      tone: 'success',
      text: [
        t('Scan.exchangeDone', { reward: title }),
        t('Scan.exchangeDoneLeft', { customer: customerName, count: result.brandAvailablePoints }),
        result.duplicate ? t('Scan.exchangeDuplicate') : null,
      ]
        .filter(Boolean)
        .join(' '),
    });
  };

  const confirmHandOver = async () => {
    const reward = handOverTarget;
    if (!reward || handOverBusy) return;
    const attempt = ++handOverAttempt.current;
    setHandOverBusy(true);
    setHandOverError(null);
    const res = await handOverReward(spotId, reward.id, card.id, { silent: true });
    if (!mounted.current || attempt !== handOverAttempt.current || stale()) return;
    setHandOverBusy(false);
    if (res.error || !res.data) {
      setHandOverError(messageForError(res.error, t('Scan.handOverError')));
      if (res.error?.code === 'REWARD_USED' || res.error?.code === 'REWARD_EXPIRED') void refreshCard();
      return;
    }
    setHandOverTarget(null);
    setCard((c) => ({
      ...c,
      readyRewards: c.readyRewards.filter((r) => r.id !== reward.id),
      readyToPickUpCount: Math.max(0, c.readyToPickUpCount - 1),
    }));
    setNotice({
      tone: 'success',
      text: t('Scan.handedOver', { reward: localText(reward.prize.title, reward.prize.titleLocal, i18n.language) }),
    });
  };

  // Closing a sheet while its request runs abandons that attempt (a retry of
  // the exchange reuses its requestId; a repeated hand-over says "used").
  const cancelExchange = () => {
    exchangeAttempt.current += 1;
    setExchangeBusy(false);
    setExchangeTarget(null);
  };
  const cancelHandOver = () => {
    handOverAttempt.current += 1;
    setHandOverBusy(false);
    setHandOverTarget(null);
  };
  const leave = () => {
    awardAttempt.current += 1;
    onDone();
  };

  const affordableIds = useMemo(() => new Set(card.affordableRewards.map((r) => r.id)), [card.affordableRewards]);

  // ---- Success screen after an award ---------------------------------------
  if (awarded) {
    return (
      <View className="items-center rounded-2xl border border-gray-200 bg-white p-8" accessibilityLiveRegion="polite">
        <Ionicons name="checkmark-circle" size={64} color="#16A34A" />
        <Typography variant="body-2xl-bold" className="mt-3 text-center text-text-primary">
          {t('Scan.awardedAtBrand', { count: awarded.awardedPoints, brand: awarded.brand.name })}
        </Typography>
        {awarded.multiplierPercent > 100 && (
          <Typography variant="body-base-semibold" className="mt-1 text-center" style={{ color: '#C2410C' }}>
            {t('Scan.awardedMultiplierLine', {
              base: awarded.basePoints,
              m: formatMultiplier(awarded.multiplierPercent, i18n.language),
            })}
          </Typography>
        )}
        <Typography variant="body-lg-semibold" className="mt-3 text-center text-text-primary">
          {customerName}
        </Typography>
        <Typography variant="body-base-regular" className="mt-1 text-center text-gray-700">
          {t('Scan.newBalance', { count: awarded.brandAvailablePoints })}
        </Typography>
        {awarded.duplicate && (
          <View className="mt-4 w-full rounded-xl bg-amber-50 px-4 py-3">
            <Typography variant="body-small-regular" style={{ color: '#92400E' }}>
              {t('Scan.awardDuplicate')}
            </Typography>
          </View>
        )}
        <View className="mt-6 w-full gap-3">
          <Pressable
            onPress={onDone}
            accessibilityRole="button"
            className="items-center justify-center rounded-xl"
            style={{ minHeight: 56, backgroundColor: '#EC2828' }}
          >
            <Typography variant="body-base-bold" className="text-white">
              {t('Scan.scanAnother')}
            </Typography>
          </Pressable>
          <Pressable
            onPress={() => setAwarded(null)}
            accessibilityRole="button"
            className="items-center justify-center rounded-xl border border-gray-300 bg-white"
            style={{ minHeight: 56 }}
          >
            <Typography variant="body-base-bold" className="text-gray-700">
              {t('Scan.backToCustomer')}
            </Typography>
          </Pressable>
        </View>
      </View>
    );
  }

  const exchangeTitle = exchangeTarget ? localText(exchangeTarget.title, exchangeTarget.titleLocal, i18n.language) : '';
  const handOverTitle = handOverTarget
    ? localText(handOverTarget.prize.title, handOverTarget.prize.titleLocal, i18n.language)
    : '';

  return (
    <View className="gap-4">
      <CustomerLoyaltyCard card={card} brandName={brandName} brandLogoUrl={activeSpot?.brandLogoUrl} />

      {loyaltyPaused && (
        <View className="rounded-xl bg-amber-50 px-4 py-3" accessibilityRole="alert">
          <Typography variant="body-base-semibold" style={{ color: '#92400E' }}>
            {t(`Errors.codes.${reason}`)}
          </Typography>
          <Typography variant="body-small-regular" className="mt-0.5" style={{ color: '#92400E' }}>
            {t('Scan.loyaltyPaused')}
          </Typography>
        </View>
      )}

      {notice && (
        <View
          className="flex-row items-start rounded-xl px-4 py-3"
          style={{ backgroundColor: notice.tone === 'success' ? '#DCFCE7' : '#F3F4F6' }}
          accessibilityLiveRegion="polite"
        >
          <Ionicons name="checkmark-circle" size={22} color="#15803D" />
          <Typography variant="body-base-semibold" className="ml-2 flex-1" style={{ color: '#14532D' }}>
            {notice.text}
          </Typography>
        </View>
      )}

      <HandOverRewardList
        rewards={card.readyRewards}
        disabled={handOverPaused}
        onHandOver={(reward) => {
          setHandOverError(null);
          setHandOverTarget(reward);
        }}
      />

      {/* Add points */}
      <View className="gap-3 rounded-2xl border border-gray-200 bg-white p-4">
        <Typography variant="body-lg-bold" className="text-text-primary" accessibilityRole="header">
          {t('Scan.addPointsTitle')}
        </Typography>

        <PromotionBanner multiplierPercent={card.activeMultiplierPercent} />

        {error && (
          <View className="rounded-xl bg-red-50 px-4 py-3" accessibilityRole="alert">
            <Typography variant="body-base-regular" style={{ color: '#B91C1C' }}>
              {error}
            </Typography>
          </View>
        )}

        <Typography variant="body-base-semibold" className="text-text-primary">
          {t('Scan.pickTemplate')}
        </Typography>
        {templatesStatus === 'error' ? (
          <View className="rounded-xl bg-red-50 px-4 py-3" accessibilityRole="alert">
            <Typography variant="body-base-regular" style={{ color: '#B91C1C' }}>
              {t('Scan.templatesLoadError')}
            </Typography>
            <Pressable
              onPress={() => void loadTemplates()}
              accessibilityRole="button"
              className="mt-2 items-center justify-center self-start rounded-xl border border-red-300 bg-white px-4"
              style={{ minHeight: 48 }}
            >
              <Typography variant="body-base-bold" style={{ color: '#B91C1C' }}>
                {t('Scan.tryAgain')}
              </Typography>
            </Pressable>
          </View>
        ) : templatesStatus === 'loading' && templates.length === 0 ? (
          <ActivityIndicator color="#EC2828" style={{ alignSelf: 'flex-start', minHeight: 48 }} />
        ) : templates.length === 0 ? (
          <Typography variant="body-small-regular" className="text-gray-600">
            {t(can.manageTemplates ? 'Scan.noTemplates' : 'Scan.noTemplatesStaff')}
          </Typography>
        ) : (
          <View className="flex-row flex-wrap gap-2">
            {templates.map((tpl) => {
              const active = selected?.id === tpl.id;
              return (
                <Pressable
                  key={tpl.id}
                  onPress={() => {
                    setSelected(active ? null : tpl);
                    setQuantity(1);
                    setCustom('');
                    setError(null);
                  }}
                  disabled={loyaltyPaused}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active, disabled: loyaltyPaused }}
                  className="justify-center rounded-2xl border-2 px-4"
                  style={{
                    minHeight: 56,
                    borderColor: active ? '#EC2828' : '#D1D5DB',
                    backgroundColor: active ? '#FEECEC' : '#fff',
                    opacity: loyaltyPaused ? 0.5 : 1,
                  }}
                >
                  <Typography variant="body-base-bold" style={{ color: active ? '#B91C1C' : '#212121' }}>
                    {localText(tpl.name, tpl.nameLocal, i18n.language)}
                  </Typography>
                  <Typography variant="body-small-regular" className="text-gray-600">
                    {t('Scan.pointsCount', { count: tpl.points })}
                  </Typography>
                </Pressable>
              );
            })}
          </View>
        )}

        {selected && (
          <View className="flex-row items-center justify-between rounded-2xl bg-gray-50 px-4 py-2">
            <Typography variant="body-base-semibold" className="text-text-primary">
              {t('Scan.quantity')}
            </Typography>
            <View className="flex-row items-center gap-2">
              <Pressable
                onPress={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1}
                accessibilityRole="button"
                accessibilityLabel={t('Scan.quantityLess')}
                className="h-12 w-12 items-center justify-center"
              >
                <Ionicons name="remove-circle-outline" size={34} color={quantity <= 1 ? '#D1D5DB' : '#EC2828'} />
              </Pressable>
              <Typography
                variant="heading-32-bold"
                className="w-12 text-center text-text-primary"
                accessibilityLabel={`${t('Scan.quantity')}: ${quantity}`}
              >
                {String(quantity)}
              </Typography>
              <Pressable
                onPress={() => setQuantity((q) => Math.min(MAX_QUANTITY, q + 1))}
                disabled={quantity >= MAX_QUANTITY}
                accessibilityRole="button"
                accessibilityLabel={t('Scan.quantityMore')}
                className="h-12 w-12 items-center justify-center"
              >
                <Ionicons name="add-circle-outline" size={34} color={quantity >= MAX_QUANTITY ? '#D1D5DB' : '#EC2828'} />
              </Pressable>
            </View>
          </View>
        )}

        {/* Custom points: spot admins and up, up to the brand's cap. */}
        {showCustom && !selected && (
          <View>
            <Typography variant="body-base-semibold" className="mb-1.5 text-text-primary">
              {t('Scan.customPoints')}
            </Typography>
            <TextInput
              value={custom}
              onChangeText={(v) => {
                setCustom(v.replace(/[^0-9]/g, ''));
                setError(null);
              }}
              editable={!loyaltyPaused}
              keyboardType="number-pad"
              placeholder="0"
              placeholderTextColor="#6B7280"
              accessibilityLabel={t('Scan.customPoints')}
              className="rounded-xl border px-4 text-lg"
              style={{ minHeight: 56, borderColor: overCap ? '#DC2626' : '#D1D5DB' }}
            />
            {cap != null && (
              <Typography
                variant="body-small-regular"
                className="mt-1"
                style={{ color: overCap ? '#B91C1C' : '#4B5563' }}
              >
                {overCap ? t('Scan.limitPerAward', { count: cap }) : t('Scan.customCapHint', { count: cap })}
              </Typography>
            )}
            {customPoints > 0 && (
              <TextInput
                value={note}
                onChangeText={setNote}
                maxLength={200}
                editable={!loyaltyPaused}
                placeholder={t('Scan.customNote')}
                placeholderTextColor="#6B7280"
                accessibilityLabel={t('Scan.customNote')}
                className="mt-2 rounded-xl border border-gray-300 px-4 text-base"
                style={{ minHeight: 48 }}
              />
            )}
          </View>
        )}

        <Pressable
          onPress={award}
          disabled={!canAward}
          accessibilityRole="button"
          accessibilityState={{ disabled: !canAward, busy }}
          className="items-center justify-center rounded-xl px-4"
          style={{ minHeight: 56, backgroundColor: canAward ? '#EC2828' : '#F4A3A3' }}
        >
          {busy ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Typography variant="body-lg-bold" className="text-center text-white">
              {points <= 0
                ? t('Scan.addPointsTitle')
                : selected && multiplier > 100
                  ? t('Scan.awardMultiplied', { base: basePoints, m, count: points })
                  : t('Scan.awardPoints', { count: points })}
            </Typography>
          )}
        </Pressable>
      </View>

      {!loyaltyPaused && (
        <ExchangeRewardList
          rewards={card.affordableRewards}
          disabled={exchangeBusy}
          onSelect={(reward) => {
            setExchangeError(null);
            setExchangeTarget(reward);
          }}
        />
      )}

      <BrandRewardsList
        rewards={brandRewards}
        availablePoints={card.availablePoints}
        excludeIds={loyaltyPaused ? new Set<string>() : affordableIds}
        brandName={brandName}
      />

      {can.manageTemplates && (
        <View className="rounded-2xl border border-gray-200 bg-white p-4">
          <Pressable
            onPress={() => setManaging((v) => !v)}
            accessibilityRole="button"
            accessibilityState={{ expanded: managing }}
            className="flex-row items-center justify-between"
            style={{ minHeight: 44 }}
          >
            <Typography variant="body-base-semibold" className="text-text-primary">
              {t('Scan.manageTemplates')}
            </Typography>
            <Ionicons name={managing ? 'chevron-up' : 'chevron-down'} size={20} color="#4B5563" />
          </Pressable>
          {managing && <TemplateManager spotId={spotId} templates={templates} onChanged={loadTemplates} />}
        </View>
      )}

      <Pressable
        onPress={leave}
        accessibilityRole="button"
        className="items-center justify-center rounded-xl border border-gray-300 bg-white"
        style={{ minHeight: 56 }}
      >
        <Typography variant="body-base-bold" className="text-gray-700">
          {t(notice ? 'Scan.done' : 'Scan.cancel')}
        </Typography>
      </Pressable>

      {/* A3: one confirm step before points are spent. */}
      <ConfirmSheet
        visible={!!exchangeTarget}
        title={t('Scan.exchangeConfirmTitle')}
        message={
          exchangeTarget
            ? `${t('Scan.exchangeConfirmCost', { reward: exchangeTitle, count: exchangeTarget.pointsCost })} ${t(
                'Scan.exchangeConfirmLeft',
                { customer: customerName, count: Math.max(0, card.availablePoints - exchangeTarget.pointsCost) },
              )}`
            : undefined
        }
        confirmLabel={t('Scan.confirm')}
        cancelLabel={t('Scan.cancel')}
        busy={exchangeBusy}
        error={exchangeError}
        onConfirm={() => void confirmExchange()}
        onCancel={cancelExchange}
      />

      <ConfirmSheet
        visible={!!handOverTarget}
        title={t('Scan.handOverConfirmTitle')}
        message={handOverTarget ? t('Scan.handOverConfirm', { reward: handOverTitle, customer: customerName }) : undefined}
        confirmLabel={t('Scan.handOver')}
        cancelLabel={t('Scan.cancel')}
        busy={handOverBusy}
        error={handOverError}
        onConfirm={() => void confirmHandOver()}
        onCancel={cancelHandOver}
      />
    </View>
  );
}

function TemplateManager({
  spotId,
  templates,
  onChanged,
}: {
  spotId: string;
  templates: PointTemplate[];
  onChanged: () => void;
}) {
  const { t, i18n } = useTranslation();
  const [name, setName] = useState('');
  const [points, setPoints] = useState('');
  const [busy, setBusy] = useState(false);

  const add = async () => {
    const p = parseInt(points, 10);
    if (!name.trim() || !p || p <= 0) return;
    setBusy(true);
    await createPointTemplate(spotId, name.trim(), p);
    setName('');
    setPoints('');
    setBusy(false);
    onChanged();
  };

  const remove = async (id: string) => {
    await deletePointTemplate(id);
    onChanged();
  };

  return (
    <View className="mt-3 gap-3">
      {templates.map((tpl) => (
        <View key={tpl.id} className="flex-row items-center justify-between rounded-xl bg-gray-50 px-3" style={{ minHeight: 48 }}>
          <Typography variant="body-base-semibold" className="flex-1 text-text-primary">
            {localText(tpl.name, tpl.nameLocal, i18n.language)} · {t('Scan.pointsCount', { count: tpl.points })}
          </Typography>
          <Pressable
            onPress={() => void remove(tpl.id)}
            accessibilityRole="button"
            accessibilityLabel={t('Scan.deleteTemplate')}
            className="h-11 w-11 items-center justify-center"
          >
            <Ionicons name="trash-outline" size={20} color="#B91C1C" />
          </Pressable>
        </View>
      ))}
      <View className="flex-row gap-2">
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder={t('Scan.templateName')}
          placeholderTextColor="#6B7280"
          className="flex-1 rounded-xl border border-gray-300 px-3 text-base"
          style={{ minHeight: 48 }}
        />
        <TextInput
          value={points}
          onChangeText={(v) => setPoints(v.replace(/[^0-9]/g, ''))}
          keyboardType="number-pad"
          placeholder={t('Scan.templatePoints')}
          placeholderTextColor="#6B7280"
          className="w-24 rounded-xl border border-gray-300 px-3 text-base"
          style={{ minHeight: 48 }}
        />
        <Pressable
          onPress={() => void add()}
          disabled={busy}
          accessibilityRole="button"
          accessibilityLabel={t('Scan.addTemplate')}
          className="w-12 items-center justify-center rounded-xl"
          style={{ backgroundColor: '#EC2828' }}
        >
          <Ionicons name="add" size={22} color="#fff" />
        </Pressable>
      </View>
    </View>
  );
}
