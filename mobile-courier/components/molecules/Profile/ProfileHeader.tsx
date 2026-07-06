import { HeaderWithBackButton } from '@/components/HeaderWithBackButton';
import { HeaderButton } from '@/components/atoms/HeaderButton';
import { router } from "expo-router";
import React, { useState } from 'react';
import { View } from 'react-native';
import { NotificationsPopup } from './NotificationsPopup';

export const ProfileHeader = () => {
  const [isNotificationsVisible, setIsNotificationsVisible] = useState(false);

  const handleSettingsPress = () => {
    router.push('/settings');
  };

  const handleNotificationsPress = () => {
    setIsNotificationsVisible(true);
  };

  const rightActions = (
    <View className="flex-row gap-2 pt-2">
      <HeaderButton iconName="settings-outline" onPress={handleSettingsPress} />
      <HeaderButton 
        iconName="notifications-outline" 
        onPress={handleNotificationsPress} 
        showBadge={false}
        badgeCount={0} 
      />
    </View>
  );

  return (
    <>
      <HeaderWithBackButton
        showBackButton={false}
        rightActions={rightActions}
      />
      <NotificationsPopup
        visible={isNotificationsVisible}
        onClose={() => setIsNotificationsVisible(false)}
        anchorPosition={{ top: 100, right: 16 }}
      />
    </>
  );
};