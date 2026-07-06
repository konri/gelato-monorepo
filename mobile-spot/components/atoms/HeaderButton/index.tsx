import React from 'react';
import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NotificationBadge } from '@/components/atoms/NotificationBadge';

interface HeaderButtonProps {
  iconName: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  showBadge?: boolean;
  badgeCount?: number;
}

export const HeaderButton = ({ iconName, onPress, showBadge, badgeCount }: HeaderButtonProps) => (
  <Pressable 
    onPress={onPress}
    className="w-11 h-11 rounded-full bg-transparent border border-gray-300 items-center justify-center relative"
  >
    <Ionicons name={iconName} size={20} color="#616161" />
    {showBadge && (
      <NotificationBadge count={badgeCount || 0} />
    )}
  </Pressable>
);
