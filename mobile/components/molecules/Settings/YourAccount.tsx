import React, { useCallback } from 'react';
import { Pressable, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { RoundedCard } from '@/components/atoms/RoundedCard';
import { Typography } from '@/components/atoms/Typography';
import { useWhoAmI } from '@/hooks/useWhoAmI';
import { PointsSection } from '@/components/molecules/PointsSection';
import { UserAvatar } from '@/components/atoms/UserAvatar';
import EditUserIcon from '@/assets/images/edit_user.svg';

interface YourAccountProps {
  onPress?: () => void;
}

export const YourAccount = ({ onPress }: YourAccountProps) => {
  const { data: user, refetch } = useWhoAmI();

  // Refresh when returning to Settings (e.g. after editing the profile) so the
  // name/avatar shown here reflect the latest saved values.
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  const fullName = [user?.firstName, user?.surname].filter(Boolean).join(' ').trim();
  const displayName = fullName || user?.name || user?.email || '';

  return (
    <Pressable onPress={onPress} disabled={!onPress}>
      <RoundedCard variant="less-rounded" shadow className="pt-2 pb-4 px-4">
        <View className="flex-row my-2 relative">
          <View className="flex-row items-start flex-1">
            <UserAvatar
              firstName={user?.firstName}
              surname={user?.surname}
              imageUrl={user?.profilePicture}
            />
            <View className="ml-4 flex-1 pr-8">
              <Typography variant="body-xl-bold" className="mb-1">
                {displayName}
              </Typography>
              {user?.email ? (
                <Typography variant="body-base-regular" className="text-gray-500 mb-2">
                  {user.email}
                </Typography>
              ) : null}
              <View className="self-start">
                <PointsSection variant="small" />
              </View>
            </View>
          </View>
          <View className="absolute right-[10px] self-center">
            <EditUserIcon width={21} height={22} />
          </View>
        </View>
      </RoundedCard>
    </Pressable>
  );
};