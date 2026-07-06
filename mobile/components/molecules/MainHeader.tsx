import React from 'react';
import { View, Alert } from 'react-native';
import { useAuthState } from '@/hooks/useAuthState';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { PointsSection } from '@/components/molecules/PointsSection';
import { UserAvatar } from '@/components/atoms/UserAvatar';
import { useTranslation } from 'react-i18next';
import { HeaderWithBackButton } from '@/components/HeaderWithBackButton';

export function MainHeader() {
  const { t } = useTranslation();
  const { user } = useAuthState();

  const handleAvatarPress = () => {
    Alert.alert(
      t('Header.logoutTitle'),
      t('Header.logoutMessage'),
      [
        { text: t('Header.cancel'), style: 'cancel' },
        {
          text: t('Header.logout'),
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.clear();
            router.replace('/onboarding');
          },
        },
      ],
    );
  };

  const rightActions = (
    <View className="flex-row items-center gap-2">
      <PointsSection />
      <UserAvatar
        firstName={user?.firstName}
        surname={user?.surname}
        onPress={handleAvatarPress}
        showNotificationDot
        notificationCount={4}
      />
    </View>
  );

  return <HeaderWithBackButton showBackButton={false} rightActions={rightActions} />;
}
