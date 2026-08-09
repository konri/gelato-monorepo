import { HeaderWithBackButton } from '@/components/HeaderWithBackButton';
import { HeaderButton } from '@/components/atoms/HeaderButton';
import { useUnreadNotificationsCount } from '@/hooks/useUnreadNotificationsCount';
import { router } from "expo-router";
import React from 'react';
import { View } from 'react-native';

export const ProfileHeader = () => {
  const { data: unreadCount } = useUnreadNotificationsCount();

  const handleSettingsPress = () => {
    router.push('/settings');
  };

  const handleNotificationsPress = () => {
    router.push('/notification_center' as never);
  };

  const rightActions = (
    <View className="flex-row gap-2 pt-2">
      <HeaderButton iconName="settings-outline" onPress={handleSettingsPress} />
      <HeaderButton
        iconName="notifications-outline"
        onPress={handleNotificationsPress}
        showBadge={!!unreadCount}
        badgeCount={unreadCount ?? 0}
      />
    </View>
  );

  return (
    <HeaderWithBackButton
      showBackButton={false}
      rightActions={rightActions}
    />
  );
};