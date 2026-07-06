import { Image } from '@/components/atoms/Image';
import { SkeletonRect } from '@/components/atoms/Skeleton';
import { SectionHeader } from '@/components/molecules/SectionHeader';
import { config } from '@/config';
import { useCurrentLocation } from '@/hooks/useCurrentLocation';
import { useDevDelay } from '@/hooks/useDevDelay';
import { useUnifiedSearch } from '@/hooks/useUnifiedSearch';
import { DEFAULT_SEARCH_RADIUS_KM } from '@/shared/constants/filters';
import { SearchSortOrder } from '@/shared/enums/SearchSortOrder';
import { router } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Pressable, Image as RNImage, ScrollView, View } from 'react-native';
import { Typography } from '../atoms/Typography';

const STREAK_LOGO_URI = `${config.API_URL}/api/static/categories/logo_streak.png`;

const NearbySkeleton = () => (
  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 8, gap: 12 }}>
    {[1, 2, 3].map((i) => (
      <View key={i} className="bg-white rounded-2xl border border-gray-100 p-3 flex-row" style={{ width: 280, height: 110 }}>
        <SkeletonRect width={128} height={96} radius={12} />
        <View className="flex-1 pl-3 gap-2 justify-center">
          <SkeletonRect width={100} height={16} radius={4} />
          <SkeletonRect width={120} height={12} radius={4} />
          <SkeletonRect width={90} height={12} radius={4} />
        </View>
      </View>
    ))}
  </ScrollView>
);

export function NearbySection() {
  const { t } = useTranslation();
  const devDelay = useDevDelay();
  const { location: userLocation, loading: locationLoading } = useCurrentLocation();

  const searchInput = React.useMemo(() => {
    if (!userLocation) return null;
    return {
      location: {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        radiusKm: DEFAULT_SEARCH_RADIUS_KM,
      },
      sort: { sortBy: SearchSortOrder.DISTANCE },
    };
  }, [userLocation]);

  const { stores, isLoading, isLoadingMore, loadMore } = useUnifiedSearch({
    input: searchInput || {},
    enabled: !locationLoading && !!userLocation,
    pageSize: 10,
  });

  if (!stores || stores.length === 0) {
    if (!locationLoading && !isLoading && !devDelay) return null;
  }

  const showSkeleton = locationLoading || isLoading || devDelay;

  return (
    <View className="mt-6">
      <SectionHeader
        title={t('Sections.nearbyStores')}
        seeAllText={t('Sections.seeAll')}
        onSeeAllPress={() => router.push('/(tabs)/merchants')}
      />

      {showSkeleton ? <NearbySkeleton /> : (
        <FlatList
        data={stores}
        renderItem={({ item }) => {
          const imageUri = item.images?.[0]?.url;
          const favIconUrl = item.isFavorite && item.favoriteIconPngUrl
            ? `${config.API_URL}${item.favoriteIconPngUrl}`
            : null;
          return (
            <Pressable
              onPress={() => router.push(`/merchant_store/${item.id}`)}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 mr-3 p-3 flex-row"
              style={{ width: 280, height: 110 }}
            >
              <View className="relative">
                <Image
                  url={imageUri}
                  className="w-32 h-24 rounded-xl"
                  resizeMode="cover"
                  fallbackWidth={128}
                  fallbackHeight={96}
                  fallbackLogoSize={20}
                />
                {favIconUrl && (
                  <RNImage
                    source={{ uri: favIconUrl }}
                    style={{ width: 20, height: 20, position: 'absolute', bottom: 4, right: 4 }}
                    resizeMode="contain"
                  />
                )}
                {item.hasStreak && (
                  <RNImage
                    source={{ uri: STREAK_LOGO_URI }}
                    style={{ width: 20, height: 20, position: 'absolute', bottom: 4, left: 4 }}
                    resizeMode="contain"
                  />
                )}
              </View>

              <View className="flex-1 pl-3 justify-center">
                <Typography variant="body-lg-semibold" className="text-text-primary mb-1" numberOfLines={1}>
                  {item.merchant?.name || item.name}
                </Typography>
                <Typography variant="body-small-regular" className="text-gray-500 mb-0.5" numberOfLines={2}>
                  {item.name}
                </Typography>
                <Typography variant="body-small-regular" className="text-gray-500" numberOfLines={1}>
                  {item.address}
                </Typography>
              </View>
            </Pressable>
          );
        }}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 8 }}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          isLoadingMore ? (
            <View className="py-4 items-center justify-center" style={{ width: 80 }}>
              <SkeletonRect width={280} height={110} radius={16} />
            </View>
          ) : null
        }
      />
      )}
    </View>
  );
}
