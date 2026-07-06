import React from 'react';
import { View, Pressable } from 'react-native';
import { RoundedCard } from '@/components/atoms/RoundedCard';
import { Typography } from '@/components/atoms/Typography';
import { useAuthState } from '@/hooks/useAuthState';
import { PointsSection } from '@/components/molecules/PointsSection';
import { UserAvatar } from '@/components/atoms/UserAvatar';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

export const UserCard = () => {
  const { t } = useTranslation();
  const { user } = useAuthState();

  const handleQRPress = () => {
    router.push('/(tabs)/qr');
  };

  return (
    <View className="my-4">
      <RoundedCard variant="less-rounded" shadow className="pt-2 pb-4 px-4">
        <View className="flex-row my-4">
          <View className="flex-row items-start">
            <UserAvatar
              firstName={user?.firstName}
              surname={user?.surname}
              showNotificationDot
              notificationCount={3}
            />

            <View className="ml-4">
              <View className="flex-row items-end">
              <Typography variant="body-xl-bold" className="mb-1">
                {user?.firstName || 'Dawid'} {user?.surname}
              </Typography>
              <Typography variant="body-base-bold" className="text-gray-500 mb-2">
                @{'nick'}
              </Typography>
              </View>
              <View className="self-start">
                <PointsSection variant="small" />
              </View>
            </View>
          </View>
        </View>

        <Pressable
          className="flex-row items-center my-2 pt-6 px-6"
          onPress={handleQRPress}
        >
          <Ionicons name="qr-code-outline" size={20} color="#616161" />
          <Typography variant="body-base-semibold" className="ml-2 flex-1">
            {t('Profile.myQR')}
          </Typography>
          <Typography className="text-gray-600 text-xl">→</Typography>
        </Pressable>
      </RoundedCard>
    </View>
  );
};