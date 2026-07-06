import { Image } from '@/components/atoms/Image';
import { Typography } from '@/components/atoms/Typography';
import React from 'react';
import { Pressable, View } from 'react-native';

export type UserActivityType = 'points' | 'stamps' | 'streak';

interface UserActivityCardProps {
  logoUrl?: string;
  storeName: string;
  statusLabel: string;
  isReady: boolean;
  onPress?: () => void;
}

export function UserActivityCard({ logoUrl, storeName, statusLabel, isReady, onPress }: UserActivityCardProps) {
  return (
    <Pressable
      onPress={onPress}
      className="bg-white rounded-2xl border border-gray-100 mr-3 overflow-hidden"
      style={{ width: 120, height: 170, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2 }}
    >
      <View className="w-full items-center justify-center bg-gray-50" style={{ height: 90 }}>
        <Image
          url={logoUrl}
          fallbackWidth={80}
          fallbackHeight={80}
          fallbackLogoSize={24}
          className="w-full h-full"
          resizeMode="contain"
        />
      </View>

      <View className="flex-1 px-2 pt-2 justify-between pb-2">
        <Typography variant="body-base-bold" className="text-text-primary" numberOfLines={2}>
          {storeName}
        </Typography>
        <Typography
          variant="body-base-small"
          className={isReady ? 'text-accent' : 'text-gray-500'}
          numberOfLines={1}
        >
          {statusLabel}
        </Typography>
      </View>
    </Pressable>
  );
}
