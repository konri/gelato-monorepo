import { FallbackImage } from '@/components/atoms/FallbackImage/FallbackImage';
import { Typography } from '@/components/atoms/Typography';
import { config } from '@/config';
import { router } from 'expo-router';
import React from 'react';
import { Image, Pressable, View } from 'react-native';
import { StoreCardProps } from './types';
import { getPromotionBadge } from './utils';

const STREAK_LOGO_URI = `${config.API_URL}/api/static/categories/logo_streak.png`;

export const StoreCard = ({ item, onPress }: StoreCardProps) => {
  const mainImage = item.images?.find((img: any) => img.type === 'main');
  const badgeText = getPromotionBadge(item.availablePromotions);
  const favIconUrl = item.isFavorite && item.favoriteIconPngUrl
    ? `${config.API_URL}${item.favoriteIconPngUrl}`
    : null;

  const handlePress = () => {
    if (onPress) {
      onPress(item.id);
    } else {
      router.push(`/merchant_store/${item.id}`);
    }
  };

  return (
    <Pressable 
      className="flex-1 m-2" 
      style={{ maxWidth: '46%' }}
      onPress={handlePress}
    >
      <View className="relative">
        {mainImage ? (
          <View className="w-full h-30 rounded-2xl overflow-hidden">
            <Image
              source={{ uri: `${config.API_URL}${mainImage.url}` }}
              className="w-full h-full"
              resizeMode="cover"
            />
          </View>
        ) : (
          <View className="w-full h-30 rounded-2xl overflow-hidden">
            <FallbackImage borderRadius={16} logoSize={28} />
          </View>
        )}
        {favIconUrl && (
          <Image
            source={{ uri: favIconUrl }}
            style={{ width: 22, height: 22 }}
            className="absolute bottom-2 right-2"
            resizeMode="contain"
          />
        )}
        {item.hasStreak && (
          <Image
            source={{ uri: STREAK_LOGO_URI }}
            style={{ width: 22, height: 22 }}
            className="absolute bottom-2 left-2"
            resizeMode="contain"
          />
        )}
        {badgeText && (
          <View className="absolute bottom-2 right-2 bg-white rounded-full px-2 border-[1px] border-accent">
            <Typography variant="body-small-semibold" className="text-accent">
              {badgeText}
            </Typography>
          </View>
        )}
      </View>
      <Typography
        variant="body-small-semibold"
        className="text-gray-800 mt-2"
        numberOfLines={1}
      >
        {item.name}
      </Typography>
    </Pressable>
  );
};
