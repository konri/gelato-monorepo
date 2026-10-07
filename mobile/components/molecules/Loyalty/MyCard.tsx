import { BrandPickerSheet } from '@/components/molecules/Brands/BrandPickerSheet';
import { CitySelectorModal } from '@/components/molecules/Settings/CitySelectorModal';
import { TAB_BAR_HEIGHT, TAB_BAR_TOTAL_HEIGHT } from '@/constants/tabBarStyles';
import { useBrands } from '@/hooks/useBrands';
import { useReduceMotion } from '@/hooks/useReduceMotion';
import { localizedCityName } from '@/utils/cityMatch';
import { formatTimeInZone } from '@/utils/formatPoints';
import { modeBrandId } from '@/utils/loyaltyMode';
import { onLoggedOut, onSessionExpired } from '@/shared/api-client/src/session';
import { readLastCard, readStoredUserId, type LastCard } from '@/utils/loyaltyStorage';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useIsFocused } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  LayoutChangeEvent,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LoyaltyCodeCard } from './LoyaltyCodeCard';
import { LoyaltyCodeFullscreen } from './LoyaltyCodeFullscreen';
import { LoyaltyPointsCard } from './LoyaltyPointsCard';
import { LoyaltyPointsStrip } from './LoyaltyPointsStrip';
import { ReadyToPickUpBanner } from './ReadyToPickUpBanner';

const MIN_QR = 120;
const MAX_QR = 220;
const FOLD_MARGIN = 8;
const FOCUS_MAX_AGE_MS = 10_000;
const GAIN_CELEBRATE_MS = 5_000;

/**
 * Home ▸ My card (BRANDS_SPEC §5.4), code first:
 *   1. points strip   2. the card (QR | barcode)   3. reward waiting
 *   4. progress, promotion, [See rewards]          5. points history
 *
 * The QR size is computed from the measured layout so the whole card is
 * visible without scrolling (375×667 at 100 % and 130 % text size).
 */
export function MyCard() {
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isFocused = useIsFocused();
  const reduceMotion = useReduceMotion();
  const brands = useBrands();
  const {
    mode,
    me,
    city,
    selectedWallet,
    paused,
    readyToPickUp,
    lastGain,
    offline,
    failed,
    fetchedAt,
    refresh,
    ensureLoaded,
    setCardFocused,
  } = brands;

  const [pickerOpen, setPickerOpen] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [cityModal, setCityModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lastCard, setLastCard] = useState<LastCard | null>(null);
  const [confettiKey, setConfettiKey] = useState(0);

  // Focus: auto-follow allowed, fresh numbers (10 s).
  useFocusEffect(
    useCallback(() => {
      setCardFocused(true);
      ensureLoaded();
      void refresh({ maxAgeMs: FOCUS_MAX_AGE_MS });
      return () => setCardFocused(false);
    }, [setCardFocused, ensureLoaded, refresh]),
  );

  // Offline: the card renders from the last stored code of this user.
  useEffect(() => {
    let active = true;
    void Promise.all([readLastCard(), readStoredUserId()]).then(([card, uid]) => {
      if (active && card && (!uid || card.userId === uid)) setLastCard(card);
    });
    // The session ended: never keep the previous user's card in memory, even
    // if this screen is still mounted under /welcome (review #1).
    const forget = () => {
      active = false;
      setLastCard(null);
    };
    const unsubLogout = onLoggedOut(forget);
    const unsubExpired = onSessionExpired(forget);
    return () => {
      active = false;
      unsubLogout();
      unsubExpired();
    };
  }, []);

  // The stored card only stands in for the same user (or before `me` loads).
  const fallbackCard = lastCard && (!me || lastCard.userId === me.id) ? lastCard : null;
  const code = me?.loyaltyCode ?? fallbackCard?.loyaltyCode ?? null;
  const userId = me?.id ?? fallbackCard?.userId ?? null;
  const pausedWithPoints = paused.find((w) => w.availablePoints > 0) ?? null;

  // Celebrate a credit on the brand shown here (not with Reduce Motion).
  const shownBrandId = modeBrandId(mode);
  const celebrated = useRef(0);
  useEffect(() => {
    if (!lastGain || lastGain.at === celebrated.current) return;
    celebrated.current = lastGain.at;
    if (!isFocused || lastGain.change <= 0 || lastGain.brandId !== shownBrandId) return;
    if (Date.now() - lastGain.at > GAIN_CELEBRATE_MS) return;
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (!reduceMotion) setConfettiKey((k) => k + 1);
  }, [lastGain, isFocused, shownBrandId, reduceMotion]);

  // The picker exists only with ≥ 2 engaged brands (MULTI).
  useEffect(() => {
    if (mode.kind !== 'MULTI' && pickerOpen) setPickerOpen(false);
  }, [mode.kind, pickerOpen]);

  // --- QR size: keep the code card above the fold -------------------------
  // The bottom tab bar overlays the screen (StandardTabsLayout: 70 + inset;
  // native tabs are smaller, so this errs on the safe side).
  const [viewportH, setViewportH] = useState(0);
  const [cardBox, setCardBox] = useState<{ y: number; h: number; qr: number } | null>(null);
  const [qrSize, setQrSize] = useState(200);
  const qrRef = useRef(qrSize);
  qrRef.current = qrSize;
  const bottomOverlay = TAB_BAR_HEIGHT + insets.bottom;

  useEffect(() => {
    if (!viewportH || !cardBox) return;
    // Everything in the card but the code area, measured with the size it had.
    const chrome = cardBox.h - cardBox.qr;
    const room = viewportH - bottomOverlay - FOLD_MARGIN - cardBox.y - chrome;
    const maxByWidth = width - 32 - 24;
    const target = Math.max(MIN_QR, Math.min(MAX_QR, maxByWidth, Math.floor(room)));
    setQrSize((prev) => (Math.abs(target - prev) >= 2 ? target : prev));
  }, [viewportH, cardBox, bottomOverlay, width]);

  const onViewportLayout = (e: LayoutChangeEvent) => {
    const h = Math.round(e.nativeEvent.layout.height);
    if (h !== viewportH) setViewportH(h);
  };
  const onCardLayout = (e: LayoutChangeEvent) => {
    const { y, height } = e.nativeEvent.layout;
    const next = { y: Math.round(y), h: Math.round(height), qr: qrRef.current };
    setCardBox((prev) =>
      prev && prev.y === next.y && prev.h === next.h && prev.qr === next.qr ? prev : next,
    );
  };

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refresh({ maxAgeMs: 0 });
    } finally {
      setRefreshing(false);
    }
  }, [refresh]);

  const time = fetchedAt ? formatTimeInZone(new Date(fetchedAt).toISOString(), null, i18n.language) : '';
  const statusLine = !time
    ? null
    : offline
      ? t('Loyalty.offlineUpdatedAt', { time })
      : failed
        ? t('Loyalty.updatedAt', { time })
        : null;

  const goRewards = () => router.navigate('/prizes' as never);

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView
        className="flex-1 bg-gray-50"
        onLayout={onViewportLayout}
        contentContainerStyle={{ paddingBottom: TAB_BAR_TOTAL_HEIGHT + 8 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#EC2828"
            colors={['#EC2828']}
          />
        }
      >
        <LoyaltyPointsStrip
          mode={mode}
          wallet={selectedWallet}
          pausedWallet={pausedWithPoints}
          city={city}
          statusLine={statusLine}
          lastGain={lastGain}
          onChange={() => setPickerOpen(true)}
          onInfo={(brandId) => router.push(`/brand/${brandId}` as never)}
          onChooseCity={() => setCityModal(true)}
          onDiscover={goRewards}
          onRetry={() => void refresh({ maxAgeMs: 0 })}
        />

        <View onLayout={onCardLayout}>
          <LoyaltyCodeCard
            code={code}
            userId={userId}
            qrSize={qrSize}
            onBigger={() => setFullscreen(true)}
          />
        </View>

        <ReadyToPickUpBanner
          items={readyToPickUp}
          onOpenOne={(id) => router.push(`/prize/mine/${id}` as never)}
          onOpenAll={goRewards}
        />

        <LoyaltyPointsCard
          mode={mode}
          wallet={selectedWallet}
          onSeeRewards={goRewards}
          onChooseCity={() => setCityModal(true)}
        />

        <Pressable
          onPress={() => router.push('/orders' as never)}
          accessibilityRole="button"
          accessibilityLabel={t('Loyalty.pointsHistory')}
          className="mx-4 mt-3 flex-row items-center rounded-2xl border border-gray-200 bg-white px-4 active:opacity-80"
          style={{ minHeight: 64 }}
        >
          <Ionicons name="time-outline" size={24} color="#374151" />
          <Text
            className="ml-3 flex-1 font-urbanist text-gray-900"
            style={{ fontSize: 18, fontWeight: '600' }}
            maxFontSizeMultiplier={1.5}
          >
            {t('Loyalty.pointsHistory')}
          </Text>
          <Ionicons name="chevron-forward" size={22} color="#4B5563" />
        </Pressable>
      </ScrollView>

      {confettiKey > 0 ? (
        <View pointerEvents="none" className="absolute inset-0">
          <ConfettiCannon
            key={confettiKey}
            count={120}
            origin={{ x: width / 2, y: -10 }}
            autoStart
            fadeOut
            fallSpeed={2600}
            colors={['#F59E0B', '#FCD34D', '#EC2828', '#F97316', '#16A34A', '#FFFFFF']}
          />
        </View>
      ) : null}

      <LoyaltyCodeFullscreen
        visible={fullscreen}
        onClose={() => setFullscreen(false)}
        code={code}
        userId={userId}
      />

      <BrandPickerSheet
        visible={pickerOpen && mode.kind === 'MULTI'}
        onClose={() => setPickerOpen(false)}
        selectedBrandId={shownBrandId}
      />

      {/* Mounted only when needed: it loads the city list. */}
      {cityModal ? (
        <CitySelectorModal
          visible
          currentCity={city ? localizedCityName(city, i18n.language) : undefined}
          onClose={() => setCityModal(false)}
          onSelected={() => setCityModal(false)}
        />
      ) : null}
    </View>
  );
}
