import { NotificationBadge } from '@/components/atoms/NotificationBadge';
import { Typography } from '@/components/atoms/Typography';
import { getInitials } from '@/utils/userUtils';
import React from 'react';
import { Image, Pressable, View } from 'react-native';

type UserAvatarProps = {
  firstName?: string;
  surname?: string;
  imageUrl?: string | null;
  onPress?: () => void;
  showNotificationDot?: boolean;
  notificationCount?: number;
};

export const UserAvatar = ({
  firstName,
  surname,
  imageUrl,
  onPress,
  showNotificationDot = false,
  notificationCount = 0,
}: UserAvatarProps) => {
  const shellClassName =
    'relative h-size-39 w-size-38 shrink-0 overflow-visible';

  const inner = (
    <View className="h-full w-full">
      <View
        className="absolute left-0 top-0 h-size-37 w-size-37 items-center justify-center overflow-hidden rounded-full border border-white bg-user-primary"
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.25,
          shadowRadius: 4,
          elevation: 4,
        }}
      >
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} className="h-full w-full" resizeMode="cover" />
        ) : (
          <Typography
            variant="body-xl-bold"
            className="text-center font-bold leading-initials text-initials text-white tracking-0.2"
          >
            {getInitials(firstName, surname)}
          </Typography>
        )}
      </View>
      {showNotificationDot ? (
        <NotificationBadge count={notificationCount} variant="avatar" />
      ) : null}
    </View>
  );

  if (onPress != null) {
    return (
      <Pressable onPress={onPress} className={shellClassName}>
        {inner}
      </Pressable>
    );
  }

  return <View className={shellClassName}>{inner}</View>;
};
