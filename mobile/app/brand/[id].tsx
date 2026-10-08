import { BrandLogo } from '@/components/atoms/BrandLogo';
import { Image } from '@/components/atoms/Image';
import { BrandPromotionBanner } from '@/components/molecules/Loyalty/BrandPromotionBanner';
import {
  BackHeader,
  COLORS,
  EmptyState,
  LText,
  SectionTitle,
} from '@/components/molecules/Loyalty/ui';
import { HowToEarnCard } from '@/components/molecules/Rewards/HowToEarnCard';
import { RewardCatalog } from '@/components/molecules/Rewards/RewardCatalog';
import { useBrands } from '@/hooks/useBrands';
import { brandRewardsKey, refreshQuery, useBrandDetail } from '@/hooks/useRewards';
import type { BrandLocation, LoyaltyCity } from '@/shared/api-client/src/graphql/queries/loyalty/types';
import { localizedCityName } from '@/utils/cityMatch';
import { formatNumber, pointsText } from '@/utils/formatPoints';
import { localizedText } from '@/utils/localizedText';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { THEME } from '@/constants/palette';

/**
 * Brand page (BRANDS_SPEC §5.5): cover, logo, description, "Your points
 * here", promotions, how to collect, rewards and locations (the user's city
 * first). A paused brand is not served by `brand(id)`: the page then explains
 * from the user's paused wallet.
 */
export default function BrandScreen() {
  const insets = useSafeAreaInsets();
  const { t, i18n } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: brand, loading, error, refetch } = useBrandDetail(id ?? null);
  const { walletFor, cityId, refresh, overview, status } = useBrands();
  const wallet = walletFor(id);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      if (id) refreshQuery(brandRewardsKey(id));
      await Promise.all([refetch(), refresh({ maxAgeMs: 0 })]);
    } finally {
      setRefreshing(false);
    }
  }, [id, refetch, refresh]);

  const lang = i18n.language;
  const locations = useMemo(
    () => groupLocations(brand?.spots ?? [], brand?.cities ?? [], cityId, lang),
    [brand, cityId, lang],
  );

  const name = brand?.name ?? wallet?.brand.name ?? '';

  if (loading && !brand) {
    return (
      <View className="flex-1 bg-gray-50">
        <BackHeader title={name || null} topInset={insets.top} />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={COLORS.accent} />
        </View>
      </View>
    );
  }

  if (!brand) {
    return (
      <View className="flex-1 bg-gray-50">
        <BackHeader title={name || null} topInset={insets.top} />
        <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}>
          {/* `brand(id)` answers null (no error) for a paused brand; a failed
              request is a load error even when the user has a wallet there. */}
          {wallet && (wallet.paused || !error) ? (
            <EmptyState
              icon="pause-circle-outline"
              title={t('Brand.pausedTitle', { brand: wallet.brand.name })}
              body={t('Brand.pausedLine', {
                brand: wallet.brand.name,
                pointsText: pointsText(t, wallet.availablePoints),
              })}
            />
          ) : error ? (
            <EmptyState
              icon="cloud-offline-outline"
              title={t('Brand.loadFailed')}
              action={{ label: t('Loyalty.retry'), onPress: () => void refetch(), secondary: true }}
            />
          ) : (
            <EmptyState icon="help-circle-outline" title={t('Brand.notFound')} />
          )}
        </ScrollView>
      </View>
    );
  }

  const description = localizedText(brand.descriptionLocal, i18n.language) || brand.description || '';
  const points = wallet?.availablePoints ?? 0;
  // Like the spot page (review #8): no "0 points" before the wallets load.
  const pointsKnown = !!overview && status === 'ready';

  return (
    <View className="flex-1 bg-gray-50">
      <BackHeader title={brand.name} topInset={insets.top} />
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={COLORS.accent} colors={[COLORS.accent]} />
        }
      >
        {brand.coverUrl ? (
          <Image
            url={brand.coverUrl}
            resizeMode="cover"
            style={{ width: '100%', height: 180 }}
            accessibilityElementsHidden
            importantForAccessibility="no"
          />
        ) : null}

        <View className="mx-4 mt-4 flex-row items-center">
          <BrandLogo brand={brand} size={64} />
          <View className="ml-3 flex-1">
            {description ? (
              <LText size={18} color={THEME.text}>
                {description}
              </LText>
            ) : (
              <LText size={18} color={COLORS.secondary}>
                {t('Brand.locations', { count: brand.spots.length })}
              </LText>
            )}
          </View>
        </View>

        <View
          className="mx-4 mt-4 rounded-3xl border border-gray-200 bg-white p-4"
          accessible
          accessibilityLabel={[
            pointsKnown ? `${t('Brand.yourPointsTitle')}: ${pointsText(t, points)}` : null,
            t('Loyalty.ruleLine', { brand: brand.name }),
          ]
            .filter(Boolean)
            .join('. ')}
        >
          <LText size={18} color={COLORS.secondary}>
            {t('Brand.yourPointsTitle')}
          </LText>
          {pointsKnown ? (
            <View className="flex-row flex-wrap items-baseline">
              <LText size={44} lineHeight={52} weight="700" color={COLORS.brand} max={1.3}>
                {formatNumber(points)}
              </LText>
              <LText size={20} weight="600" className="ml-2" max={1.3}>
                {t('Loyalty.pointsUnit', { count: points })}
              </LText>
            </View>
          ) : status === 'error' ? (
            <LText size={44} lineHeight={52} weight="700" color={COLORS.secondary} max={1.3}>
              —
            </LText>
          ) : (
            <View className="items-start py-3">
              <ActivityIndicator color={COLORS.brand} />
            </View>
          )}
          <LText size={16} color={COLORS.secondary} className="mt-1">
            {t('Loyalty.ruleLine', { brand: brand.name })}
          </LText>
        </View>

        {brand.activePromotions.length > 0 ? (
          <>
            <SectionTitle text={t('Brand.promotionsTitle')} />
            {brand.activePromotions.map((p) => (
              <BrandPromotionBanner key={p.taskId} promotion={p} />
            ))}
          </>
        ) : null}

        <HowToEarnCard brand={brand} />
        <RewardCatalog brand={brand} />

        <SectionTitle text={t('Brand.locationsTitle')} />
        {locations.length === 0 ? (
          <LText size={18} color={COLORS.secondary} className="mx-4 mt-2">
            {t('Brand.noLocations')}
          </LText>
        ) : (
          locations.map((group) => (
            <View key={group.cityId}>
              {locations.length > 1 && group.cityName ? (
                <LText size={18} weight="700" color={THEME.text} className="mx-4 mt-4">
                  {group.cityName}
                </LText>
              ) : null}
              {group.spots.map((spot) => (
                <Pressable
                  key={spot.id}
                  onPress={() => router.push(`/spot/${spot.id}` as never)}
                  accessibilityRole="button"
                  accessibilityLabel={`${spot.name}. ${spot.address}`}
                  className="mx-4 mt-2 flex-row items-center rounded-2xl border border-gray-200 bg-white px-4 py-3 active:opacity-80"
                  style={{ minHeight: 72 }}
                >
                  <Ionicons name="location-outline" size={24} color={COLORS.brand} />
                  <View className="ml-3 flex-1">
                    <LText size={20} weight="700" numberOfLines={2}>
                      {spot.name}
                    </LText>
                    <LText size={16} color={COLORS.secondary}>
                      {spot.address}
                    </LText>
                  </View>
                  <Ionicons name="chevron-forward" size={22} color={COLORS.secondary} />
                </Pressable>
              ))}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

/** Active locations grouped by city, the user's city first. */
function groupLocations(spots: BrandLocation[], cities: LoyaltyCity[], myCityId: string | null, lang: string) {
  const names = new Map(cities.map((c) => [c.id, localizedCityName(c, lang)]));
  const groups = new Map<string, BrandLocation[]>();
  for (const s of spots) {
    if (!s.isActive) continue;
    groups.set(s.cityId, [...(groups.get(s.cityId) ?? []), s]);
  }
  return [...groups.entries()]
    .map(([cid, list]) => ({
      cityId: cid,
      cityName: names.get(cid) ?? '',
      spots: [...list].sort((a, b) => a.name.localeCompare(b.name)),
    }))
    .sort((a, b) => (a.cityId === myCityId ? -1 : b.cityId === myCityId ? 1 : a.cityName.localeCompare(b.cityName)));
}
