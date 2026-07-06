import { SkeletonCircle, SkeletonText } from '@/components/atoms/Skeleton';
import { Typography } from '@/components/atoms/Typography';
import { FavoriteMerchantRewardCard } from '@/components/molecules/FavoriteMerchantRewardCard';
import { SectionHeader } from '@/components/molecules/SectionHeader';
import { config } from '@/config';
import { ActivityItem, ActivityItemStatus } from '@/hooks/useAwardsFilters';
import { useDevDelay } from '@/hooks/useDevDelay';
import { FavoriteStore } from '@/shared/api-client/src/graphql/queries/favoriteStores/types';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Image, Pressable, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';

interface FavoriteMerchantsSectionProps {
  favorites: FavoriteStore[];
  loading: boolean;
  onStorePress: (storeId: string) => void;
  onSeeAllPress?: () => void;
  activityItems?: ActivityItem[];
  getStatus?: (item: ActivityItem) => ActivityItemStatus;
  hasActiveFilters?: boolean;
}

const FavoriteSkeleton = () => (
  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 16 }}>
    {[1, 2, 3, 4].map((i) => (
      <View key={i} className="items-center gap-2">
        <SkeletonCircle size={64} />
        <SkeletonText width={56} lines={1} lineHeight={12} />
      </View>
    ))}
  </ScrollView>
);

export function FavoriteMerchantsSection({ favorites, loading, onStorePress, onSeeAllPress, activityItems, getStatus, hasActiveFilters }: FavoriteMerchantsSectionProps) {
  const { t } = useTranslation();
  const devDelay = useDevDelay();

  const getStoreIdFromItem = (a: ActivityItem): string => {
    if (a.type === 'store' || a.type === 'no-activity') return a.data.id;
    return a.data.store.id;
  };

  const useRewardVariant = !!(activityItems && getStatus);

  // When filters are active, only show favorites that appear in activityItems
  const activeStoreIds = useRewardVariant && hasActiveFilters
    ? new Set(activityItems!.map(getStoreIdFromItem))
    : null;

  const visibleFavorites = activeStoreIds
    ? favorites.filter((f) => activeStoreIds.has(f.merchantStore.id))
    : favorites;

  // Use order from activityItems (backend sort) when reward variant is active
  const orderedFavorites = useRewardVariant && activityItems && activityItems.length > 0
    ? (() => {
        const favMap = new Map(visibleFavorites.map((f) => [f.merchantStore.id, f]));
        const seen = new Set<string>();
        const ordered: typeof favorites = [];
        activityItems.forEach((a) => {
          const storeId = getStoreIdFromItem(a);
          const fav = favMap.get(storeId);
          if (fav && !seen.has(fav.merchantStore.id)) {
            seen.add(fav.merchantStore.id);
            ordered.push(fav);
          }
        });
        if (!hasActiveFilters) {
          visibleFavorites.forEach((f) => { if (!seen.has(f.merchantStore.id)) ordered.push(f); });
        }
        return ordered;
      })()
    : visibleFavorites;

  if (!devDelay && !loading && orderedFavorites.length === 0) return null;

  const getActivityForStore = (storeId: string): { item: ActivityItem; status: ActivityItemStatus } | null => {
    if (!activityItems || !getStatus) return null;
    const item = activityItems.find((a) => getStoreIdFromItem(a) === storeId);
    if (!item) return null;
    return { item, status: getStatus(item) };
  };

  const getStampIconUrl = (item: ActivityItem): string | undefined => {
    if (item.type === 'stamp') return (item.data as any).stampIconUrl;
    return undefined;
  };

  return (
    <View className="mt-6">
      <SectionHeader
        title={t('Sections.favoriteMerchants')}
        seeAllText={t('Sections.seeAll')}
        onSeeAllPress={onSeeAllPress}
        className="px-6"
      />

      {loading || devDelay ? <FavoriteSkeleton /> : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: useRewardVariant ? 40 : 0, paddingBottom: 8, gap: 12 }}
          style={{ overflow: 'visible' }}
        >
          {orderedFavorites.map((item) => {
            const rawUrl = item.merchantStore.logoUrl || item.merchantStore.merchant.logoUrl;
            const logoUrl = rawUrl ? `${config.API_URL}${rawUrl}` : undefined;

            if (useRewardVariant) {
              const activity = getActivityForStore(item.merchantStore.id);
              return (
                <FavoriteMerchantRewardCard
                  key={item.id}
                  logoUrl={rawUrl ?? undefined}
                  storeName={item.merchantStore.name}
                  statusLabel={activity ? activity.status.label : t('Award.noActivity')}
                  isReady={activity ? activity.status.isReady : false}
                  hasActivity={!!activity && activity.item.type !== 'no-activity'}
                  stampIconUrl={activity ? getStampIconUrl(activity.item) : undefined}
                  onPress={() => onStorePress(item.merchantStore.id)}
                />
              );
            }

            return (
              <Pressable key={item.id} className="items-center mr-4" onPress={() => onStorePress(item.merchantStore.id)}>
                <View className="w-16 h-16 bg-white rounded-full items-center justify-center shadow-sm border border-gray-100">
                  {logoUrl ? (
                    <Image source={{ uri: logoUrl }} className="w-14 h-14" resizeMode="contain" />
                  ) : null}
                </View>
                <Typography variant="body-small-regular" className="text-gray-700 mt-2 text-center max-w-[60px]">
                  {item.merchantStore.name}
                </Typography>
              </Pressable>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}
