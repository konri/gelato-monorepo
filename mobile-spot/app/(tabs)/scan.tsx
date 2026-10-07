import { Typography } from '@/components/atoms/Typography';
import { ResponsiveContainer } from '@/components/atoms/ResponsiveContainer';
import { withSpotScope } from '@/components/hoc/withSpotScope';
import { TabHeader } from '@/components/organisms/TabHeader';
import { QrScanner, type ScanSource } from '@/components/molecules/QrScanner';
import { LoyaltyAward } from '@/components/molecules/LoyaltyAward';
import { PrizeRedeem } from '@/components/molecules/PrizeRedeem';
import { OrderCollect } from '@/components/molecules/OrderCollect';
import { HiddenScannerInput } from '@/components/molecules/Scan/HandheldScannerInput';
import { IdlePromotionBanner } from '@/components/molecules/Scan/PromotionBanner';
import { ScanMismatchCard, type ScanMode } from '@/components/molecules/Scan/ScanMismatchCard';
import { ScannerGuideModal } from '@/components/molecules/Scan/ScannerGuideModal';
import { TAB_BAR_TOTAL_HEIGHT } from '@/constants/tabBarStyles';
import { useActiveSpot } from '@/hooks/useActiveSpot';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { spotStore } from '@/stores/spotStore';
import { messageForError } from '@/utils/errorCodes';
import { staffScan, type LoyaltyCard, type StaffScanResult } from '@repo/api-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Platform, Pressable, ScrollView, Switch, View } from 'react-native';

const HANDHELD_KEY = 'scan.handheld';
// The camera keeps seeing a code that just failed: ignore it for a moment.
const SAME_CODE_COOLDOWN_MS = 3000;
// After "Scan another" / "Done" the camera usually still sees the card that
// was just handled. Until it has been out of view this long, the camera does
// not reopen it on its own: it asks.
const SAME_CODE_GUARD_MS = 30_000;

type HandledCode = {
  raw: string;
  normalized: string | null;
  /** The customer's name (customer cards only). */
  name: string | null;
  /** When its result was left, or the camera last saw it since (null while the result is shown). */
  seenAt: number | null;
};

const matchesHandled = (raw: string, last: HandledCode): boolean =>
  raw === last.raw || (!!last.normalized && raw.toUpperCase() === last.normalized.toUpperCase());

type Phase =
  | { kind: 'idle' }
  | { kind: 'checking' }
  | { kind: 'result'; result: StaffScanResult };

const MODES: { mode: ScanMode; label: string }[] = [
  { mode: 'loyalty', label: 'Scan.tabLoyalty' },
  { mode: 'collect', label: 'Scan.tabCollect' },
  { mode: 'prize', label: 'Scan.tabPrize' },
];

const PROMPTS: Record<ScanMode, string> = {
  loyalty: 'Scan.scanUserPrompt',
  collect: 'Scan.scanCollectPrompt',
  prize: 'Scan.scanPrizePrompt',
};

const hasCard = (r: StaffScanResult): r is StaffScanResult & { customer: LoyaltyCard } => !!r.customer;

/**
 * Scan tab (BRANDS_SPEC §4.8). One pipeline for the camera (QR, Code 128), a
 * keyboard-wedge scanner and typed codes: the raw value goes to
 * staffScan(activeSpot, raw) and the server says what it is (a customer card,
 * a reward code, or nothing). The mode decides what happens next; a code
 * that does not fit the mode gets a card to switch modes without rescanning.
 */
function ScanScreen() {
  const { t } = useTranslation();
  const { isWide } = useBreakpoint();
  // The screen remounts on a spot switch (withSpotScope), so a half-finished
  // scan never carries over to another spot.
  const { activeSpotId: spotId, brandId } = useActiveSpot();

  const [mode, setMode] = useState<ScanMode>('loyalty');
  const [phase, setPhase] = useState<Phase>({ kind: 'idle' });
  const [scanError, setScanError] = useState<string | null>(null);
  const [handheld, setHandheld] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const scanReq = useRef(0);
  const lastFailed = useRef<{ raw: string; at: number } | null>(null);
  // Survives the result screen (this screen stays mounted): M3 same-code guard.
  const lastHandled = useRef<HandledCode | null>(null);
  const [sameCode, setSameCode] = useState<{ raw: string; name: string | null } | null>(null);
  const showingResult = useRef(false);

  useEffect(() => {
    showingResult.current = phase.kind === 'result';
  }, [phase]);

  const markResultLeft = useCallback(() => {
    if (showingResult.current && lastHandled.current) lastHandled.current.seenAt = Date.now();
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    AsyncStorage.getItem(HANDHELD_KEY)
      .then((v) => setHandheld(v === '1'))
      .catch(() => {});
  }, []);

  const toggleHandheld = (value: boolean) => {
    setHandheld(value);
    AsyncStorage.setItem(HANDHELD_KEY, value ? '1' : '0').catch(() => {});
  };

  const reset = useCallback(() => {
    markResultLeft();
    scanReq.current += 1;
    setPhase({ kind: 'idle' });
    setScanError(null);
  }, [markResultLeft]);

  const switchMode = (m: ScanMode) => {
    setMode(m);
    setSameCode(null);
    reset();
  };

  /**
   * One pipeline for every input. Camera reads get two guards; keyboard input
   * (wedge scanner, typing, "Open again") is deliberate and always checked:
   * - a code that just failed is ignored for 3 s;
   * - the code handled last is not reopened by the camera until it has been
   *   out of view for 30 s since its result was left (the customer usually
   *   still holds the card up after "Scan another"). Instead a "Same code
   *   again" card offers "Open again", and the camera keeps reading other
   *   codes. Asking is safer than a silent cooldown: a card that stays in
   *   view never opens on its own, so nobody adds points to the previous
   *   customer believing it is the next one.
   */
  const handleScan = useCallback(
    async (value: string, source: ScanSource) => {
      const raw = value.trim();
      if (!raw || !spotId) return;
      if (source === 'camera') {
        const now = Date.now();
        const failed = lastFailed.current;
        if (failed && failed.raw === raw && now - failed.at < SAME_CODE_COOLDOWN_MS) return;
        const last = lastHandled.current;
        if (last && matchesHandled(raw, last) && last.seenAt != null && now - last.seenAt < SAME_CODE_GUARD_MS) {
          last.seenAt = now; // still in view: keep guarding
          setSameCode((prev) => (prev?.raw === last.raw ? prev : { raw: last.raw, name: last.name }));
          return;
        }
      }
      markResultLeft();
      setSameCode(null);
      const req = ++scanReq.current;
      setScanError(null);
      setPhase({ kind: 'checking' });
      const res = await staffScan(spotId, raw, { silent: true });
      if (req !== scanReq.current || spotStore.getActiveSpotId() !== spotId) return;
      const result = res.data;
      const fail = (message: string) => {
        lastFailed.current = { raw, at: Date.now() };
        setScanError(message);
        setPhase({ kind: 'idle' });
      };
      if (res.error || !result) return fail(messageForError(res.error, t('Scan.scanError')));
      if (result.kind === 'UNKNOWN') return fail(t('Scan.unknownCode'));
      if (result.kind === 'CUSTOMER' && !result.customer) return fail(t('Scan.customerNotFound'));
      lastFailed.current = null;
      lastHandled.current = {
        raw,
        normalized: result.normalizedCode ?? null,
        name: result.kind === 'CUSTOMER' ? result.customer?.name?.trim() || null : null,
        seenAt: null,
      };
      setPhase({ kind: 'result', result });
    },
    [spotId, t, markResultLeft],
  );
  const onKeyboardScan = useCallback((v: string) => void handleScan(v, 'keyboard'), [handleScan]);

  const renderResult = (result: StaffScanResult) => {
    if (!spotId) return null;
    if (result.kind === 'REWARD') {
      return mode === 'prize' ? (
        <PrizeRedeem scan={result} spotId={spotId} onDone={reset} />
      ) : (
        <ScanMismatchCard scanned="REWARD" onSwitch={setMode} onCancel={reset} />
      );
    }
    if (!hasCard(result)) return null;
    if (mode === 'loyalty') return <LoyaltyAward scan={result} spotId={spotId} onDone={reset} />;
    if (mode === 'collect') return <OrderCollect customer={result.customer} spotId={spotId} onDone={reset} />;
    return <ScanMismatchCard scanned="CUSTOMER" onSwitch={setMode} onCancel={reset} />;
  };

  return (
    <View className="flex-1 bg-gray-50">
      <TabHeader title={t('Scan.title')} />

      <ScrollView
        className="flex-1"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: 16, paddingBottom: (isWide ? 24 : TAB_BAR_TOTAL_HEIGHT) + 16 }}
      >
        <ResponsiveContainer maxWidth={560}>
          {/* Mode toggle */}
          <View className="mb-4 flex-row rounded-2xl bg-gray-100 p-1" accessibilityRole="tablist">
            {MODES.map(({ mode: m, label }) => {
              const active = mode === m;
              return (
                <Pressable
                  key={m}
                  onPress={() => switchMode(m)}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: active }}
                  className="flex-1 items-center justify-center rounded-xl px-1"
                  style={{ minHeight: 48, backgroundColor: active ? '#fff' : 'transparent' }}
                >
                  <Typography
                    variant="body-base-bold"
                    className="text-center"
                    style={{ color: active ? '#B91C1C' : '#4B5563' }}
                    numberOfLines={2}
                  >
                    {t(label)}
                  </Typography>
                </Pressable>
              );
            })}
          </View>

          {phase.kind === 'result' ? (
            renderResult(phase.result)
          ) : (
            <View className="gap-3">
              <IdlePromotionBanner brandId={brandId} spotId={spotId} />

              <Typography variant="body-base-regular" className="text-gray-700">
                {t(PROMPTS[mode])}
              </Typography>

              {sameCode && phase.kind === 'idle' && (
                <View className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3" accessibilityRole="alert">
                  <Typography variant="body-base-semibold" style={{ color: '#78350F' }}>
                    {t('Scan.sameCodeTitle')}
                  </Typography>
                  <Typography variant="body-base-regular" className="mt-0.5" style={{ color: '#92400E' }}>
                    {sameCode.name ? t('Scan.sameCustomerBody', { name: sameCode.name }) : t('Scan.sameCodeBody')}
                  </Typography>
                  <Pressable
                    onPress={() => onKeyboardScan(sameCode.raw)}
                    accessibilityRole="button"
                    className="mt-3 items-center justify-center self-start rounded-xl px-5"
                    style={{ minHeight: 48, backgroundColor: '#B45309' }}
                  >
                    <Typography variant="body-base-bold" className="text-white">
                      {t('Scan.openAgain')}
                    </Typography>
                  </Pressable>
                </View>
              )}

              {scanError && (
                <View className="flex-row items-start rounded-xl bg-red-50 px-4 py-3" accessibilityRole="alert">
                  <Ionicons name="alert-circle" size={20} color="#B91C1C" />
                  <Typography variant="body-base-semibold" className="ml-2 flex-1" style={{ color: '#B91C1C' }}>
                    {scanError}
                  </Typography>
                </View>
              )}

              {phase.kind === 'checking' && (
                <View className="flex-row items-center rounded-xl bg-white px-4 py-3" accessibilityLiveRegion="polite">
                  <ActivityIndicator color="#EC2828" />
                  <Typography variant="body-base-semibold" className="ml-3 text-gray-700">
                    {t('Scan.checkingCode')}
                  </Typography>
                </View>
              )}

              {/* Stays mounted while a code is checked, so the camera does not restart. */}
              <QrScanner
                onScan={(v, source) => void handleScan(v, source)}
                disabled={phase.kind === 'checking'}
                handheld={handheld}
              />

              {Platform.OS !== 'web' && (
                <View
                  className="flex-row items-center rounded-2xl border border-gray-200 bg-white px-4"
                  style={{ minHeight: 64 }}
                >
                  <Ionicons name="barcode-outline" size={22} color="#374151" />
                  <View className="ml-3 flex-1 py-2">
                    <Typography variant="body-base-semibold" className="text-text-primary">
                      {t('Scan.handheldMode')}
                    </Typography>
                    <Typography variant="body-small-regular" className="text-gray-600">
                      {t('Scan.handheldModeHint')}
                    </Typography>
                  </View>
                  <Switch
                    value={handheld}
                    onValueChange={toggleHandheld}
                    accessibilityLabel={t('Scan.handheldMode')}
                    trackColor={{ true: '#EC2828', false: '#D1D5DB' }}
                    thumbColor="#fff"
                  />
                </View>
              )}

              <Pressable
                onPress={() => setGuideOpen(true)}
                accessibilityRole="link"
                className="flex-row items-center justify-center"
                style={{ minHeight: 48 }}
              >
                <Ionicons name="help-circle-outline" size={20} color="#B91C1C" />
                <Typography variant="body-base-semibold" className="ml-1.5" style={{ color: '#B91C1C' }}>
                  {t('Scan.guideLink')}
                </Typography>
              </Pressable>
            </View>
          )}
        </ResponsiveContainer>
      </ScrollView>

      {/* A result screen keeps listening to a hardware scanner (web, handheld
          mode): the next scan replaces the result. Outside the ScrollView, so
          taking the focus never scrolls the result. */}
      {phase.kind === 'result' && (Platform.OS === 'web' || handheld) && (
        <HiddenScannerInput onScan={onKeyboardScan} />
      )}

      <ScannerGuideModal visible={guideOpen} onClose={() => setGuideOpen(false)} />
    </View>
  );
}

export default withSpotScope(ScanScreen);
