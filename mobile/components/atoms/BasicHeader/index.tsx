import React from 'react';
import { View, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Lockup from '@/assets/images/loodly_lockup.svg';
import { THEME } from '@/constants/palette';

interface BasicHeaderProps {
  onBack?: () => void;
  showBackButton?: boolean;
  rightActions?: React.ReactNode;
}

export const BasicHeader = ({ onBack, showBackButton = true, rightActions }: BasicHeaderProps) => {
  return (
    <View className="flex-row items-center justify-between px-6 pt-0 pb-1">
      <View className="flex-row items-center">
        {showBackButton && (
          <Pressable onPress={onBack || (() => router.back())} className="w-10 h-10 rounded-full bg-white items-center justify-center mr-3">
            <Ionicons name="chevron-back" size={20} color={THEME.textSecondary} />
          </Pressable>
        )}
        <View className={`flex-row items-center ${showBackButton ? 'pl-2' : ''}`}>
          <Lockup width={80} height={55} />
        </View>
      </View>
      
      {rightActions && (
        <View className="flex-row items-center space-x-2">
          {rightActions}
        </View>
      )}
    </View>
  );
};