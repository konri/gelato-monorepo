import { Image } from '@/components/atoms/Image';
import { Typography } from '@/components/atoms/Typography';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, ScrollView, View } from 'react-native';

export interface Story {
  id: string;
  storeId: string;
  storeName: string;
  storeLogoUrl?: string;
  imageUrl: string;
  createdAt: string;
  expiresAt: string;
  isViewed: boolean;
}

export interface StoreStories {
  storeId: string;
  storeName: string;
  storeLogoUrl?: string;
  isFavorite: boolean;
  stories: Story[];
  hasUnread: boolean;
}

interface StoriesSectionProps {
  storeStories: StoreStories[];
  onStoryPress: (storeId: string, stories: Story[]) => void;
}

export const StoriesSection = ({ storeStories, onStoryPress }: StoriesSectionProps) => {
  // Sort: favorites first, then by unread status, then by most recent story
  const sortedStores = [...storeStories].sort((a, b) => {
    // Favorites first
    if (a.isFavorite && !b.isFavorite) return -1;
    if (!a.isFavorite && b.isFavorite) return 1;

    // Then by unread status
    if (a.hasUnread && !b.hasUnread) return -1;
    if (!a.hasUnread && b.hasUnread) return 1;

    // Then by most recent story
    const aLatest = Math.max(...a.stories.map(s => new Date(s.createdAt).getTime()));
    const bLatest = Math.max(...b.stories.map(s => new Date(s.createdAt).getTime()));
    return bLatest - aLatest;
  });

  // Filter: show favorites always, show non-favorites only if they have unread stories
  const visibleStores = sortedStores.filter(
    store => store.isFavorite || store.hasUnread
  );

  if (visibleStores.length === 0) {
    return null;
  }

  return (
    <View className="bg-white border-b border-gray-100 py-4">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 16 }}
      >
        {visibleStores.map((store) => (
          <Pressable
            key={store.storeId}
            onPress={() => onStoryPress(store.storeId, store.stories)}
            className="items-center"
            style={{ width: 72 }}
          >
            {/* Story Ring */}
            <View
              className="rounded-full p-0.5 mb-1"
              style={{
                width: 68,
                height: 68,
                background: store.hasUnread
                  ? 'linear-gradient(45deg, #EC2828, #FFA500)'
                  : 'transparent',
                borderWidth: store.hasUnread ? 0 : 2,
                borderColor: store.hasUnread ? 'transparent' : '#E5E7EB',
              }}
            >
              <View className="w-full h-full rounded-full bg-white p-0.5 items-center justify-center">
                <View className="w-full h-full rounded-full overflow-hidden bg-gray-100">
                  {store.storeLogoUrl ? (
                    <Image
                      url={store.storeLogoUrl}
                      fallbackWidth={64}
                      fallbackHeight={64}
                      fallbackLogoSize={24}
                      rounded={true}
                      className="w-full h-full"
                      resizeMode="cover"
                    />
                  ) : (
                    <View className="w-full h-full items-center justify-center">
                      <Ionicons name="storefront" size={28} color="#6B7280" />
                    </View>
                  )}
                </View>
              </View>
            </View>

            {/* Store Name */}
            <Typography
              variant="body-small-regular"
              className="text-gray-700 text-center"
              numberOfLines={2}
              style={{ fontSize: 11 }}
            >
              {store.storeName}
            </Typography>

            {/* Favorite indicator */}
            {store.isFavorite && (
              <View className="absolute top-0 right-0 bg-red-500 rounded-full w-4 h-4 items-center justify-center">
                <Ionicons name="heart" size={10} color="white" />
              </View>
            )}
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
};
