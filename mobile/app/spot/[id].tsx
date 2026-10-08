import { BrandLogo } from '@/components/atoms/BrandLogo';
import { Image } from '@/components/atoms/Image';
import { BrandPromotionBanner } from '@/components/molecules/Loyalty/BrandPromotionBanner';
import { COLORS, LText } from '@/components/molecules/Loyalty/ui';
import { StarRating } from '@/components/atoms/StarRating';
import { SpotReviews } from '@/components/spots/SpotReviews';
import { useBrands } from '@/hooks/useBrands';
import { isSpotOpenNow, useFavoriteToggle } from '@/hooks/useSpots';
import { useSpotDetail, useSpotTastes } from '@/hooks/useTastes';
import type { Taste } from '@repo/api-client';
import { pointsText } from '@/utils/formatPoints';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Image as RNImage,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { THEME } from '@/constants/palette';

const WEEKDAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export default function SpotDetailScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [refreshing, setRefreshing] = useState(false);
  const fav = useFavoriteToggle();

  const { data: spot, loading, refetch: refetchSpot } = useSpotDetail(id ?? null);
  const { data: tastes, refetch: refetchTastes } = useSpotTastes(id ?? null);
  const { walletFor, overview, status } = useBrands();

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([refetchSpot(), refetchTastes()]);
    } finally {
      setRefreshing(false);
    }
  }, [refetchSpot, refetchTastes]);

  if (loading) {
    return (
      <View className="flex-1 bg-mainBg items-center justify-center">
        <ActivityIndicator size="large" color={THEME.primary} />
      </View>
    );
  }

  if (!spot) {
    return (
      <View className="flex-1 bg-mainBg items-center justify-center px-6">
        <Text className="font-urbanist text-text-secondary">{t('Common.error')}</Text>
      </View>
    );
  }

  const openMaps = () =>
    Linking.openURL(`https://maps.google.com/?q=${spot.latitude},${spot.longitude}`);
  const callSpot = () => spot.phone && Linking.openURL(`tel:${spot.phone}`);

  const hours =
    spot.openingHours && typeof spot.openingHours === 'object' ? spot.openingHours : null;
  const open = isSpotOpenNow(spot.openingHours);
  const favorited = fav.isFavorite(spot.id, spot.isFavorite);
  const gallery = (spot.photos ?? []).filter(Boolean);
  // "Your points here" only once the wallets are known: while loading, or
  // when loading failed with no data, "0 points" would be wrong (review #8).
  // A loaded overview without this brand means no points there yet.
  const pointsLine =
    spot.brand && overview && status === 'ready'
      ? t('Brand.yourPointsHere', {
          pointsText: pointsText(t, walletFor(spot.brand.id)?.availablePoints ?? 0),
        })
      : null;

  return (
    <View className="flex-1 bg-mainBg">
      <ScrollView
        className="flex-1"
        contentContainerClassName="pb-10"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={THEME.primary}
            colors={[THEME.primary]}
          />
        }
      >
        <View className="relative">
          <Image url={spot.coverUrl ?? undefined} className="w-full h-72" resizeMode="cover" fallbackLogoSize={72} />
          <Pressable
            onPress={() => router.back()}
            className="absolute left-4 bg-white/90 rounded-full p-2"
            style={{ top: insets.top + 8 }}
            hitSlop={8}
          >
            <Ionicons name="arrow-back" size={22} color={THEME.text} />
          </Pressable>
          <Pressable
            onPress={() => fav.toggle(spot.id, favorited)}
            className="absolute right-4 bg-white/90 rounded-full p-2"
            style={{ top: insets.top + 8 }}
            hitSlop={8}
          >
            <Ionicons
              name={favorited ? 'heart' : 'heart-outline'}
              size={22}
              color={favorited ? THEME.primary : THEME.text}
            />
          </Pressable>
          {open !== null ? (
            <View
              className={`absolute bottom-3 left-4 rounded-full px-3 py-1 ${open ? 'bg-green-600' : 'bg-gray-700'}`}
            >
              <Text className="text-white text-xs font-urbanist-bold">
                {open ? t('Spots.openNow') : t('Spots.closed')}
              </Text>
            </View>
          ) : null}
        </View>

        <View className="px-6 pt-5">
          <View className="flex-row items-center">
            {spot.logoUrl ? (
              <Image
                url={spot.logoUrl}
                className="w-16 h-16 rounded-full mr-4"
                rounded
                fallbackWidth={64}
                fallbackHeight={64}
                fallbackLogoSize={24}
              />
            ) : null}
            <View className="flex-1">
              <Text className="text-2xl font-urbanist-bold text-text-primary">{spot.name}</Text>
              {spot.averageRating != null && (spot.reviewCount ?? 0) > 0 ? (
                <View className="mt-1 flex-row items-center">
                  <StarRating rating={spot.averageRating} size={16} />
                  <Text className="ml-2 font-urbanist-semibold text-text-primary">
                    {spot.averageRating.toFixed(1)}
                  </Text>
                  <Text className="ml-1 font-urbanist text-text-secondary">
                    ({spot.reviewCount})
                  </Text>
                </View>
              ) : null}
              {spot.description ? (
                <Text className="text-sm font-urbanist text-text-secondary mt-1">
                  {spot.description}
                </Text>
              ) : null}
            </View>
          </View>

          {/* The brand this location belongs to and the user's points there (§5.6). */}
          {spot.brand ? (
            <Pressable
              onPress={() => router.push(`/brand/${spot.brand!.id}` as never)}
              accessibilityRole="button"
              accessibilityLabel={[t('Brand.partOf', { brand: spot.brand.name }), pointsLine]
                .filter(Boolean)
                .join('. ')}
              className="mt-4 flex-row items-center rounded-2xl border border-gray-200 bg-white px-3 py-2 active:opacity-80"
              style={{ minHeight: 72 }}
            >
              <BrandLogo brand={spot.brand} size={44} />
              <View className="ml-3 flex-1">
                <LText size={18} weight="700" numberOfLines={2}>
                  {t('Brand.partOf', { brand: spot.brand.name })}
                </LText>
                {pointsLine ? (
                  <LText size={16} weight="600" color={COLORS.brand}>
                    {pointsLine}
                  </LText>
                ) : null}
              </View>
              <Ionicons name="chevron-forward" size={22} color={COLORS.secondary} />
            </Pressable>
          ) : null}
          {spot.activePromotion ? <BrandPromotionBanner promotion={spot.activePromotion} flush /> : null}

          {/* Quick actions */}
          <View className="flex-row mt-5">
            <Pressable
              className="flex-1 bg-accent rounded-xl py-3 flex-row items-center justify-center"
              onPress={openMaps}
            >
              <Ionicons name="navigate" size={18} color="white" />
              <Text className="text-white font-urbanist-bold ml-2">{t('Spots.directions')}</Text>
            </Pressable>
            {spot.phone ? (
              <Pressable
                className="ml-3 bg-button-secondary rounded-xl px-4 py-3 items-center justify-center"
                onPress={callSpot}
              >
                <Ionicons name="call" size={18} color={THEME.text} />
              </Pressable>
            ) : null}
          </View>

          {/* Address */}
          <View className="bg-white border border-gray-200 rounded-2xl p-4 mt-6">
            <View className="flex-row items-start">
              <Ionicons name="location" size={20} color={THEME.primary} />
              <View className="ml-3 flex-1">
                <Text className="font-urbanist-bold text-text-primary mb-1">{t('Spots.address')}</Text>
                <Text className="font-urbanist text-text-secondary">{spot.address}</Text>
              </View>
            </View>
          </View>

          {/* Contact */}
          {spot.phone || spot.email ? (
            <View className="bg-white border border-gray-200 rounded-2xl p-4 mt-4">
              <Text className="font-urbanist-bold text-text-primary mb-2">{t('Spots.contact')}</Text>
              {spot.phone ? (
                <Pressable className="flex-row items-center py-1.5" onPress={callSpot}>
                  <Ionicons name="call" size={18} color={THEME.primary} />
                  <Text className="font-urbanist text-text-primary ml-3">{spot.phone}</Text>
                </Pressable>
              ) : null}
              {spot.email ? (
                <Pressable
                  className="flex-row items-center py-1.5"
                  onPress={() => Linking.openURL(`mailto:${spot.email}`)}
                >
                  <Ionicons name="mail" size={18} color={THEME.primary} />
                  <Text className="font-urbanist text-text-primary ml-3">{spot.email}</Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}

          {/* Opening hours */}
          {hours ? (
            <View className="bg-white border border-gray-200 rounded-2xl p-4 mt-4">
              <Text className="font-urbanist-bold text-text-primary mb-2">
                {t('Spots.openingHours')}
              </Text>
              {WEEKDAYS.map((day) =>
                hours[day] ? (
                  <View key={day} className="flex-row justify-between py-1">
                    <Text className="font-urbanist text-text-secondary">{t(`Spots.weekday.${day}`)}</Text>
                    <Text className="font-urbanist text-text-primary">{hours[day]}</Text>
                  </View>
                ) : null,
              )}
            </View>
          ) : null}

          {/* Features: seating + accessibility */}
          {spot.hasSeating || spot.accessibilityFeatures ? (
            <View className="bg-white border border-gray-200 rounded-2xl p-4 mt-4">
              {spot.hasSeating ? (
                <View className="flex-row items-center py-1">
                  <Ionicons name="cafe" size={18} color={THEME.primary} />
                  <Text className="font-urbanist text-text-primary ml-3">
                    {spot.seatingCapacity
                      ? t('Spots.seatingCapacity', { count: spot.seatingCapacity })
                      : t('Spots.seating')}
                  </Text>
                </View>
              ) : null}
              {spot.accessibilityFeatures ? (
                <View className="flex-row items-start py-1">
                  <Ionicons name="accessibility" size={18} color={THEME.primary} style={{ marginTop: 2 }} />
                  <View className="ml-3 flex-1">
                    <Text className="font-urbanist-bold text-text-primary">{t('Spots.accessibility')}</Text>
                    <Text className="font-urbanist text-text-secondary">
                      {spot.accessibilityFeatures}
                    </Text>
                  </View>
                </View>
              ) : null}
            </View>
          ) : null}

          {/* Photos */}
          {gallery.length > 0 ? (
            <View className="mt-6">
              <Text className="font-urbanist-bold text-text-primary mb-3">{t('Spots.photos')}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {gallery.map((url, i) => (
                  <RNImage
                    key={`${url}-${i}`}
                    source={{ uri: url }}
                    style={{ width: 200, height: 130, borderRadius: 12, marginRight: 12 }}
                    resizeMode="cover"
                  />
                ))}
              </ScrollView>
            </View>
          ) : null}

          {/* Tastes preview */}
          {tastes && tastes.length > 0 ? (
            <View className="mt-6">
              <Text className="font-urbanist-bold text-text-primary mb-3">{t('Spots.tastesHere')}</Text>
              {tastes.map((taste: Taste) => (
                <Pressable
                  key={taste.id}
                  className="flex-row bg-white rounded-2xl mb-3 overflow-hidden border border-gray-200"
                  onPress={() => router.push(`/taste/${taste.id}`)}
                >
                  <Image
                    url={taste.imageUrl ?? undefined}
                    className="w-20 h-20"
                    resizeMode="cover"
                    fallbackWidth={80}
                    fallbackHeight={80}
                    fallbackLogoSize={24}
                  />
                  <View className="flex-1 p-3">
                    <Text className="font-urbanist-bold text-text-primary" numberOfLines={1}>
                      {taste.title}
                    </Text>
                    {taste.subtitle ? (
                      <Text className="text-xs font-urbanist text-text-secondary mt-0.5" numberOfLines={1}>
                        {taste.subtitle}
                      </Text>
                    ) : null}
                    {taste.allergens.length > 0 ? (
                      <Text className="text-xs font-urbanist text-accent mt-1" numberOfLines={1}>
                        ⚠️ {taste.allergens.join(', ')}
                      </Text>
                    ) : null}
                  </View>
                </Pressable>
              ))}
            </View>
          ) : null}

          {/* Reviews */}
          <SpotReviews spotId={spot.id} />
        </View>
      </ScrollView>
    </View>
  );
}
