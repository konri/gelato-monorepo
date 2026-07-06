import { FallbackImage } from '@/components/atoms/FallbackImage/FallbackImage';
import { Typography } from '@/components/atoms/Typography';
import { config } from '@/config';
import { TAB_BAR_TOTAL_HEIGHT } from '@/constants/tabBarStyles';
import { StoreForMap } from '@/shared/api-client/src/graphql/queries/stores/types';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Image, Pressable, View } from 'react-native';

type Props = {
  store: StoreForMap & { distance?: number };
  onClose: () => void;
};

export const MapStorePreview = ({ store, onClose }: Props) => {
  const mainImage = store.images?.find((img) => img.type === 'main');
  const distanceText = store.distance != null ? `${store.distance.toFixed(1)} km` : null;

  return (
    <Pressable
      className="bg-white rounded-3xl overflow-hidden mx-3"
      style={{ marginBottom: TAB_BAR_TOTAL_HEIGHT + 8 }}
      onPress={() => router.push(`/merchant_store/${store.id}`)}
    >
      <View className="relative">
        {mainImage ? (
          <Image
            source={{ uri: `${config.API_URL}${mainImage.url}` }}
            className="w-full h-52"
            resizeMode="cover"
          />
        ) : (
          <View className="w-full h-52">
            <FallbackImage borderRadius={0} logoSize={48} />
          </View>
        )}
        <Pressable
          onPress={onClose}
          className="absolute top-3 right-3 bg-white rounded-full w-8 h-8 items-center justify-center"
          hitSlop={8}
        >
          <Ionicons name="close" size={18} color="#212121" />
        </Pressable>
      </View>

      <View className="px-4 py-3">
        <Typography variant="body-lg-semibold" className="text-text-primary">
          {store.name}
        </Typography>
        <Typography variant="body-small-regular" className="text-text-secondary mt-0.5">
          {[distanceText, store.address].filter(Boolean).join(' • ')}
        </Typography>
      </View>
    </Pressable>
  );
};
