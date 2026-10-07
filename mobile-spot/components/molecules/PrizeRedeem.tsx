import { Typography } from '@/components/atoms/Typography';
import { spotStore } from '@/stores/spotStore';
import { messageForError } from '@/utils/errorCodes';
import { formatDate, formatShortDateTime, localText } from '@/utils/loyaltyDisplay';
import { validatePrizeQr, type CustomerReward, type ScanReason, type StaffScanResult } from '@repo/api-client';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, View } from 'react-native';

/** Why a scanned reward code can't be handed over here (staffScan `reason`). */
function reasonText(
  t: (key: string, opts?: Record<string, unknown>) => string,
  reason: ScanReason | null | undefined,
  reward: CustomerReward | null | undefined,
): { title: string; detail?: string } {
  switch (reason) {
    case 'REWARD_WRONG_BRAND':
      // Never names the other brand or the reward.
      return { title: t('Scan.rewardWrongBrand') };
    case 'REWARD_USED':
      return {
        title: t('Scan.rewardUsed'),
        detail: reward?.redeemedAt
          ? reward.redeemedAtSpot?.name
            ? t('Scan.rewardUsedAtSpot', { when: formatShortDateTime(reward.redeemedAt), spot: reward.redeemedAtSpot.name })
            : t('Scan.rewardUsedAt', { when: formatShortDateTime(reward.redeemedAt) })
          : undefined,
      };
    case 'REWARD_EXPIRED':
      return { title: t('Scan.rewardExpired') };
    case 'BRAND_INACTIVE':
      return { title: t('Scan.rewardBrandInactive') };
    case 'SPOT_INACTIVE':
      return { title: t('Errors.codes.SPOT_INACTIVE') };
    default:
      return { title: t('Scan.rewardInvalid') };
  }
}

/**
 * A reward code (PR-…) was scanned (BRANDS_SPEC §4.8): first a preview of
 * what to hand over and to whom, then "Confirm hand-over" redeems it. A
 * reward of another brand shows no title and no brand.
 */
export function PrizeRedeem({
  scan,
  spotId,
  onDone,
}: {
  /** A REWARD scan. */
  scan: StaffScanResult;
  spotId: string;
  onDone: () => void;
}) {
  const { t, i18n } = useTranslation();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  // Cancel works while the request runs; the late answer of an abandoned
  // attempt is ignored (handing the code over again says "already used").
  const attemptRef = useRef(0);
  useEffect(
    () => () => {
      attemptRef.current += 1;
    },
    [],
  );

  const reward = scan.reward ?? null;
  const title = reward ? localText(reward.prize.title, reward.prize.titleLocal, i18n.language) : '';
  const customerName = scan.customer?.name?.trim() || null;

  const confirm = async () => {
    const code = scan.normalizedCode || reward?.qrCode;
    if (!code || busy) return;
    const attempt = ++attemptRef.current;
    setBusy(true);
    setError(null);
    const res = await validatePrizeQr(code, spotId, { silent: true });
    if (attempt !== attemptRef.current || spotStore.getActiveSpotId() !== spotId) return;
    setBusy(false);
    if (res.error || !res.data) {
      setError(messageForError(res.error, t('Scan.redeemError')));
      return;
    }
    setDone(true);
  };

  const scanAnother = (
    <Pressable
      onPress={onDone}
      accessibilityRole="button"
      className="mt-6 w-full items-center justify-center rounded-xl"
      style={{ minHeight: 56, backgroundColor: '#EC2828' }}
    >
      <Typography variant="body-base-bold" className="text-white">
        {t('Scan.scanAnother')}
      </Typography>
    </Pressable>
  );

  if (!scan.rewardUsableHere || !reward) {
    const { title: why, detail } = reasonText(t, scan.reason, reward);
    const showTitle = !!reward && scan.reason !== 'REWARD_WRONG_BRAND';
    return (
      <View className="items-center rounded-2xl border border-gray-200 bg-white p-8" accessibilityRole="alert">
        <Ionicons name="close-circle" size={56} color="#B91C1C" />
        {showTitle && (
          <Typography variant="body-lg-bold" className="mt-3 text-center text-text-primary">
            {title}
          </Typography>
        )}
        <Typography variant="body-base-semibold" className="mt-2 text-center" style={{ color: '#B91C1C' }}>
          {why}
        </Typography>
        {!!detail && (
          <Typography variant="body-base-regular" className="mt-1 text-center text-gray-700">
            {detail}
          </Typography>
        )}
        {scanAnother}
      </View>
    );
  }

  if (done) {
    return (
      <View className="items-center rounded-2xl border border-gray-200 bg-white p-8" accessibilityLiveRegion="polite">
        <Ionicons name="checkmark-circle" size={64} color="#16A34A" />
        <Typography variant="body-2xl-bold" className="mt-3 text-center text-text-primary">
          {t('Scan.rewardHandedOver')}
        </Typography>
        <Typography variant="body-lg-semibold" className="mt-1 text-center text-text-primary">
          {title}
        </Typography>
        {!!customerName && (
          <Typography variant="body-base-regular" className="mt-1 text-center text-gray-700">
            {customerName}
          </Typography>
        )}
        {scanAnother}
      </View>
    );
  }

  return (
    <View className="items-center rounded-2xl border border-gray-200 bg-white p-8">
      <Ionicons name="gift" size={56} color="#16A34A" />
      <Typography variant="body-base-regular" className="mt-3 text-gray-700">
        {t('Scan.prizeReady')}
      </Typography>
      <Typography variant="heading-32-bold" className="mt-1 text-center text-text-primary">
        {title}
      </Typography>
      {!!customerName && (
        <Typography variant="body-lg-semibold" className="mt-2 text-center text-text-primary">
          {customerName}
        </Typography>
      )}
      <Typography variant="body-base-regular" className="mt-1 text-gray-700">
        {t('Scan.validUntil', { date: formatDate(reward.validUntil) })}
      </Typography>
      {error && (
        <View className="mt-4 w-full rounded-xl bg-red-50 px-4 py-3" accessibilityRole="alert">
          <Typography variant="body-base-regular" style={{ color: '#B91C1C' }}>
            {error}
          </Typography>
        </View>
      )}
      <Pressable
        onPress={() => void confirm()}
        disabled={busy}
        accessibilityRole="button"
        accessibilityState={{ busy, disabled: busy }}
        className="mt-6 w-full items-center justify-center rounded-xl"
        style={{ minHeight: 56, backgroundColor: busy ? '#86EFAC' : '#15803D' }}
      >
        {busy ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Typography variant="body-lg-bold" className="text-white">
            {t('Scan.confirmHandOver')}
          </Typography>
        )}
      </Pressable>
      <Pressable
        onPress={() => {
          attemptRef.current += 1;
          onDone();
        }}
        accessibilityRole="button"
        className="mt-3 w-full items-center justify-center rounded-xl border border-gray-300 bg-white"
        style={{ minHeight: 56 }}
      >
        <Typography variant="body-base-bold" className="text-gray-700">
          {t('Scan.cancel')}
        </Typography>
      </Pressable>
    </View>
  );
}
