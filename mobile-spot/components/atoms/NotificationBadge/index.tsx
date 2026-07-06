import { Typography } from '@/components/atoms/Typography';
import React from 'react';
import { View } from 'react-native';
import { twMerge } from 'tailwind-merge';

export type NotificationBadgeVariant = 'corner' | 'avatar';

type NotificationBadgeProps = {
  count: number;
  position?: 'top-right' | 'bottom-right';
  show?: boolean;
  variant?: NotificationBadgeVariant;
};

export const NotificationBadge = ({
  count,
  position = 'bottom-right',
  show = true,
  variant = 'corner',
}: NotificationBadgeProps) => {
  if (!show || count <= 0) return null;

  const isAvatar = variant === 'avatar';
  const containerClassName = isAvatar
    ? 'absolute left-6 top-6 h-size-14 w-size-14 items-center justify-center rounded-full bg-red-600'
    : twMerge(
        'absolute h-5 w-5 items-center justify-center rounded-full bg-accent',
        position === 'top-right' ? '-right-1 -top-1' : '-bottom-1 -right-1',
      );

  const labelVariant = isAvatar ? 'body-very-small-medium' : 'body-base-small';
  const labelClassName = isAvatar
    ? 'text-center font-bold leading-badge text-badge text-white tracking-0.2'
    : 'font-bold text-white';

  return (
    <View className={containerClassName}>
      <Typography variant={labelVariant} className={labelClassName}>
        {count > 99 ? '99+' : count}
      </Typography>
    </View>
  );
};
