import { Image } from '@/components/atoms/Image';
import { Typography } from '@/components/atoms/Typography';
import { Ionicons } from '@expo/vector-icons';
import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View, useWindowDimensions, NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';

interface NewsCardProps {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  imageUrls?: string[];
  storeName?: string;
  storeLogoUrl?: string;
  timestamp?: string;
  likes?: number;
  isLiked?: boolean;
  commentsCount?: number;
  onPress?: () => void;
  onLike?: () => void;
  onComment?: () => void;
}

export const NewsCard = ({
  id,
  title,
  description,
  imageUrl,
  imageUrls,
  storeName,
  storeLogoUrl,
  timestamp,
  likes = 0,
  isLiked = false,
  commentsCount = 0,
  onPress,
  onLike,
  onComment,
}: NewsCardProps) => {
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  // Use imageUrls if provided, otherwise fall back to single imageUrl
  const images = imageUrls || (imageUrl ? [imageUrl] : []);
  const hasMultipleImages = images.length > 1;

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / width);
    setCurrentImageIndex(index);
  };

  return (
    <Pressable
      onPress={onPress}
      className="bg-white mb-3 border-b border-gray-100"
    >
      {/* Header - Store Info */}
      {storeName && (
        <View className="flex-row items-center px-4 py-3">
          <View className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center overflow-hidden">
            {storeLogoUrl ? (
              <Image
                url={storeLogoUrl}
                fallbackWidth={40}
                fallbackHeight={40}
                fallbackLogoSize={16}
                rounded={true}
                className="w-full h-full"
                resizeMode="cover"
              />
            ) : (
              <Ionicons name="storefront-outline" size={20} color="#6B7280" />
            )}
          </View>
          <View className="flex-1 ml-3">
            <Typography variant="body-base-semibold" className="text-gray-900">
              {storeName}
            </Typography>
            {timestamp && (
              <Typography variant="body-small-regular" className="text-gray-500">
                {timestamp}
              </Typography>
            )}
          </View>
        </View>
      )}

      {/* Image Carousel or Single Image */}
      {images.length > 0 && (
        <View className="w-full relative" style={{ aspectRatio: 1 }}>
          <ScrollView
            ref={scrollViewRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            decelerationRate="fast"
            contentContainerStyle={{ flexGrow: 1 }}
            bounces={false}
            waitFor={hasMultipleImages ? undefined : []}
            simultaneousHandlers={hasMultipleImages ? undefined : []}
          >
            {images.map((item, index) => (
              <View key={`${item}-${index}`} style={{ width, aspectRatio: 1 }}>
                <Image
                  url={item}
                  fallbackWidth={400}
                  fallbackHeight={400}
                  fallbackLogoSize={64}
                  rounded={false}
                  className="w-full h-full"
                  resizeMode="cover"
                />
              </View>
            ))}
          </ScrollView>

          {/* Page Indicators */}
          {hasMultipleImages && (
            <View className="absolute bottom-3 left-0 right-0 flex-row justify-center gap-1.5">
              {images.map((_, index) => (
                <View
                  key={index}
                  className="rounded-full"
                  style={{
                    width: 6,
                    height: 6,
                    backgroundColor: index === currentImageIndex ? '#EC2828' : 'rgba(255, 255, 255, 0.6)',
                  }}
                />
              ))}
            </View>
          )}
        </View>
      )}

      {/* Actions Row */}
      <View className="flex-row items-center px-4 py-3">
        <Pressable onPress={onLike} className="mr-4" hitSlop={8}>
          <Ionicons
            name={isLiked ? 'heart' : 'heart-outline'}
            size={26}
            color={isLiked ? '#EC2828' : '#212121'}
          />
        </Pressable>
        <Pressable onPress={onComment} hitSlop={8}>
          <Ionicons name="chatbubble-outline" size={24} color="#212121" />
        </Pressable>
      </View>

      {/* Likes Count */}
      {likes > 0 && (
        <Typography variant="body-base-semibold" className="text-gray-900 px-4 pb-2">
          {t('Home.likeCount', { count: likes })}
        </Typography>
      )}

      {/* Content */}
      <View className="px-4 pb-3">
        {title && (
          <Typography variant="body-base-bold" className="text-gray-900 mb-1">
            {title}
          </Typography>
        )}
        {description && (
          <Typography variant="body-base-regular" className="text-gray-700">
            {description}
          </Typography>
        )}

        {/* View Comments Link */}
        {commentsCount > 0 && (
          <Pressable onPress={onComment} hitSlop={8} className="mt-2">
            <Typography variant="body-small-regular" className="text-gray-500">
              {t('Home.viewAllComments', { count: commentsCount })}
            </Typography>
          </Pressable>
        )}
      </View>
    </Pressable>
  );
};
