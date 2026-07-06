import { GradientPillButton } from '@/components/molecules/Button';
import { usePointBalance } from '@/hooks/usePointBalance';
import React from 'react';
import { Image } from 'react-native';

export const PointsSection = ({ variant = 'default' }: { variant?: 'default' | 'small' }) => {
  const { data: pointBalance } = usePointBalance();

  const isSmall = variant === 'small';
  const points = pointBalance?.availablePoints ?? 0;

  return (
    <GradientPillButton
      className="z-10"
      size={isSmall ? 'small' : 'default'}
      title={String(points)}
      rightIcon={
        <Image
          source={require('@/assets/images/logo.png')}
          className={isSmall ? 'h-3 w-3' : 'h-5 w-5'}
          resizeMode="contain"
        />
      }
    />
  );
};
