import React from 'react';
import { View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Typography } from '@/components/atoms/Typography';

export interface NotificationItemProps {
  title: string;
  description: string;
  time: string;
  icon: keyof typeof Ionicons.glyphMap;
  isRead: boolean;
  onPress?: () => void;
}

export const NotificationItem = ({ title, description, time, icon, isRead, onPress }: NotificationItemProps) => (
  <Pressable onPress={onPress} className="flex-row items-start py-4">
    <View className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center mr-3 relative">
      <Ionicons name={icon} size={20} color="#616161" />
      {!isRead && (
        <View className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-accent" />
      )}
    </View>
    <View className="flex-1">
      <View className="flex-row items-start justify-between mb-1">
        <Typography className="flex-1 text-gray-900">
          {title}
        </Typography>
        <Ionicons name="chevron-forward" size={20} color="#A9A9A9" />
      </View>
      <Typography className="text-gray-600 mb-2">
        {description}
      </Typography>
      <Typography className="text-gray-400">
        {time}
      </Typography>
    </View>
  </Pressable>
);
