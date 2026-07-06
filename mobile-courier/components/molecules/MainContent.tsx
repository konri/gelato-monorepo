import { GradientPillButton } from '@/components/molecules/Button';
import { TAB_BAR_TOTAL_HEIGHT } from '@/constants/tabBarStyles';
import { useFavoriteStores } from '@/hooks/useFavoriteStores';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { useRouter } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { RefreshControl, ScrollView, View } from 'react-native';
import { SharedValue } from 'react-native-reanimated';
import { FavoriteMerchantsSection } from './FavoriteMerchantsSection';
import { MapBottomSheetSurface } from './MapBottomSheetSurface';
import type { MapBottomSheetPanGesture } from './MapBottomSheetSurface/types';
import { NearbySection } from './NearbySection';

type MainContentProps = {
  translateY: SharedValue<number>;
  panGesture: MapBottomSheetPanGesture;
  showFullMap: boolean;
  onShowFullMap: () => void;
};

export const MainContent = ({
  translateY,
  panGesture,
  showFullMap,
  onShowFullMap,
}: MainContentProps) => {
  const { t } = useTranslation();
  const router = useRouter();

  const { data: favorites, loading: favoritesLoading } = useFavoriteStores();
  const { refreshing, onRefresh } = usePullToRefresh();

  const handleStorePress = (storeId: string) => {
    router.push(`/merchant_store/${storeId}` as any);
  };

  return (
    <MapBottomSheetSurface
      translateY={translateY}
      panGesture={panGesture}
      topAccessory={
        !showFullMap ? (
          <View className="absolute -top-16 left-0 right-0 z-10 items-center" pointerEvents="box-none">
            <GradientPillButton
              title={t('Sections.seeStoresNearby')}
              onPress={onShowFullMap}
              textVariant="body-small-semibold"
            />
          </View>
        ) : undefined
      }
    >
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        nestedScrollEnabled
        bounces
        alwaysBounceVertical
        contentInsetAdjustmentBehavior="never"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: TAB_BAR_TOTAL_HEIGHT + 24 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <NearbySection />
        <FavoriteMerchantsSection
          favorites={favorites}
          loading={favoritesLoading}
          onStorePress={handleStorePress}
        />
      </ScrollView>
    </MapBottomSheetSurface>
  );
};
