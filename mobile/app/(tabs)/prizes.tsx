import { BrandDiscoveryList } from '@/components/molecules/Brands/BrandDiscoveryList';
import { BrandHeader } from '@/components/molecules/Brands/BrandHeader';
import { BrandPickerSheet } from '@/components/molecules/Brands/BrandPickerSheet';
import { BrandPromotionBanner } from '@/components/molecules/Loyalty/BrandPromotionBanner';
import { COLORS, EmptyState, LinkRow, LText, SecondaryButton } from '@/components/molecules/Loyalty/ui';
import { HowToEarnCard } from '@/components/molecules/Rewards/HowToEarnCard';
import { PausedWallets } from '@/components/molecules/Rewards/PausedWallets';
import { ReadyToPickUpList } from '@/components/molecules/Rewards/ReadyToPickUpList';
import { RewardCatalog } from '@/components/molecules/Rewards/RewardCatalog';
import { WalletPoints } from '@/components/molecules/Rewards/WalletPoints';
import { CitySelectorModal } from '@/components/molecules/Settings/CitySelectorModal';
import { PrizeHistoryModal } from '@/components/prizes/PrizeHistoryModal';
import { TAB_BAR_TOTAL_HEIGHT } from '@/constants/tabBarStyles';
import { useBrands } from '@/hooks/useBrands';
import { brandRewardsKey, refreshQuery, useMyRewards } from '@/hooks/useRewards';
import { localizedCityName } from '@/utils/cityMatch';
import { formatTimeInZone } from '@/utils/formatPoints';
import { modeBrandId, yourPlaces } from '@/utils/loyaltyMode';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const FOCUS_MAX_AGE_MS = 10_000;

/**
 * Rewards tab (BRANDS_SPEC §5.3): one layout per loyalty mode. Rewards ready
 * to pick up (every brand) always come first; the catalog is the selected
 * brand's, and every status is computed against the reward's own brand.
 */
export default function RewardsScreen() {
  const insets = useSafeAreaInsets();
  const { t, i18n } = useTranslation();
  const {
    mode,
    overview,
    wallets,
    others,
    paused,
    selectedWallet,
    readyToPickUp,
    city,
    cityId,
    fetchedAt,
    offline,
    failed,
    refresh,
    ensureLoaded,
  } = useBrands();
  const myRewards = useMyRewards();
  const refetchMyRewards = myRewards.refetch;

  const [refreshing, setRefreshing] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [cityModal, setCityModal] = useState(false);

  // Skip the first focus: the hooks above already load on mount.
  const focusedOnce = useRef(false);
  useFocusEffect(
    useCallback(() => {
      ensureLoaded();
      void refresh({ maxAgeMs: FOCUS_MAX_AGE_MS });
      if (focusedOnce.current) void refetchMyRewards();
      focusedOnce.current = true;
    }, [ensureLoaded, refresh, refetchMyRewards]),
  );

  // The picker exists only with ≥ 2 engaged brands (MULTI).
  useEffect(() => {
    if (mode.kind !== 'MULTI' && pickerOpen) setPickerOpen(false);
  }, [mode.kind, pickerOpen]);

  const shownBrandId = modeBrandId(mode);
  const cityName = city ? localizedCityName(city, i18n.language) : '';

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      if (shownBrandId) refreshQuery(brandRewardsKey(shownBrandId));
      await Promise.all([refresh({ maxAgeMs: 0 }), refetchMyRewards()]);
    } finally {
      setRefreshing(false);
    }
  }, [refresh, refetchMyRewards, shownBrandId]);

  const time = fetchedAt ? formatTimeInZone(new Date(fetchedAt).toISOString(), null, i18n.language) : '';
  const statusLine = time && failed ? t(offline ? 'Loyalty.offlineUpdatedAt' : 'Loyalty.updatedAt', { time }) : null;
  const hasHistory = (myRewards.data ?? []).some((p) => p.isRedeemed || p.isExpired || !p.isRedeemableNow);

  const brand = selectedWallet?.brand ?? null;
  const pausedFirst = mode.kind !== 'SINGLE' && mode.kind !== 'MULTI';

  const body = () => {
    switch (mode.kind) {
      case 'LOADING':
        return (
          <View className="items-center py-16" accessibilityLabel={t('Common.loading')}>
            <ActivityIndicator size="large" color={COLORS.accent} />
          </View>
        );
      case 'ERROR':
        return (
          <EmptyState
            icon="cloud-offline-outline"
            title={t('Loyalty.loadFailed')}
            action={{ label: t('Loyalty.retry'), onPress: () => void refresh({ maxAgeMs: 0 }), secondary: true }}
          />
        );
      case 'NO_CITY':
        return (
          <EmptyState
            icon="location-outline"
            title={t('Prizes.chooseCityTitle')}
            body={t('Prizes.chooseCityBody')}
            action={{ label: t('Loyalty.chooseCity'), onPress: () => setCityModal(true) }}
          />
        );
      case 'NO_BRANDS_IN_CITY':
        return (
          <EmptyState
            icon="star-outline"
            title={t('Prizes.noneNearbyTitle')}
            body={cityName ? t('Loyalty.noRewardsInCity', { city: cityName }) : null}
            action={{ label: t('Loyalty.changeCity'), onPress: () => setCityModal(true), secondary: true }}
          />
        );
      case 'MANY_TO_DISCOVER':
        return (
          <>
            <HowToEarnCard />
            <BrandDiscoveryList
              cityId={cityId}
              cityName={cityName}
              yours={overview ? yourPlaces(overview) : []}
              cityFallback={wallets.filter((w) => w.inMyCity)}
            />
          </>
        );
      case 'ONE_TO_DISCOVER':
        if (!selectedWallet || !brand) return null;
        return (
          <>
            <BrandHeader
              brand={brand}
              action="info"
              onPress={() => router.push(`/brand/${brand.id}` as never)}
            />
            {selectedWallet.activePromotion ? <BrandPromotionBanner promotion={selectedWallet.activePromotion} /> : null}
            <HowToEarnCard brand={brand} />
            <RewardCatalog brand={brand} />
          </>
        );
      case 'SINGLE':
      case 'MULTI':
        if (!selectedWallet || !brand) return null;
        return (
          <>
            <BrandHeader
              brand={brand}
              action={mode.kind === 'MULTI' ? 'change' : 'info'}
              onPress={() =>
                mode.kind === 'MULTI' ? setPickerOpen(true) : router.push(`/brand/${brand.id}` as never)
              }
            />
            <WalletPoints wallet={selectedWallet} />
            {selectedWallet.activePromotion ? <BrandPromotionBanner promotion={selectedWallet.activePromotion} /> : null}
            <RewardCatalog brand={brand} />
            {mode.kind === 'MULTI' ? (
              <LinkRow
                icon="information-circle-outline"
                label={t('Brand.about', { brand: brand.name })}
                onPress={() => router.push(`/brand/${brand.id}` as never)}
              />
            ) : null}
            {mode.kind === 'SINGLE' && others.length > 0 ? (
              <LinkRow
                icon="storefront-outline"
                label={t('Prizes.moreWhereToCollect', { count: others.length })}
                sublabel={cityName || null}
                onPress={() => router.push('/brands' as never)}
              />
            ) : null}
          </>
        );
      default:
        return null;
    }
  };

  return (
    <View className="flex-1 bg-gray-50" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center border-b border-gray-200 px-4 py-2">
        <View className="flex-1">
          <LText size={28} lineHeight={34} weight="700" accessibilityRole="header" max={1.3}>
            {t('Prizes.title')}
          </LText>
          {statusLine ? (
            <LText size={16} color={COLORS.secondary} max={1.3}>
              {statusLine}
            </LText>
          ) : null}
        </View>
        {hasHistory ? (
          <Pressable
            onPress={() => setHistoryOpen(true)}
            accessibilityRole="button"
            accessibilityLabel={t('Prizes.history')}
            className="flex-row items-center rounded-full bg-gray-100 px-3 active:opacity-80"
            style={{ minHeight: 48 }}
          >
            <Ionicons name="time-outline" size={22} color={COLORS.text} />
            <LText size={17} weight="700" className="ml-1" max={1.3}>
              {t('Prizes.history')}
            </LText>
          </Pressable>
        ) : null}
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: TAB_BAR_TOTAL_HEIGHT + 16 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={COLORS.accent} colors={[COLORS.accent]} />
        }
      >
        {mode.kind !== 'LOADING' ? <ReadyToPickUpList items={readyToPickUp} /> : null}
        {/* Without an engaged brand the saved points of a paused brand are the
            user's only points: show them before discovery (review #3). */}
        {pausedFirst ? <PausedWallets wallets={paused} /> : null}
        {body()}
        {pausedFirst ? null : <PausedWallets wallets={paused} />}
        {/* Discovery depends on the city; wallets do not. */}
        {mode.kind === 'MANY_TO_DISCOVER' || mode.kind === 'ONE_TO_DISCOVER' ? (
          <View className="mx-4 mt-6">
            <SecondaryButton
              label={cityName ? t('Prizes.changeCityFrom', { city: cityName }) : t('Loyalty.chooseCity')}
              icon="location-outline"
              onPress={() => setCityModal(true)}
            />
          </View>
        ) : null}
      </ScrollView>

      <PrizeHistoryModal visible={historyOpen} onClose={() => setHistoryOpen(false)} prizes={myRewards.data ?? []} />

      <BrandPickerSheet
        visible={pickerOpen && mode.kind === 'MULTI'}
        onClose={() => setPickerOpen(false)}
        selectedBrandId={shownBrandId}
      />

      {cityModal ? (
        <CitySelectorModal
          visible
          currentCity={cityName || undefined}
          onClose={() => setCityModal(false)}
          onSelected={() => setCityModal(false)}
        />
      ) : null}
    </View>
  );
}
