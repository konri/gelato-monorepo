import React from 'react';
import { View } from 'react-native';
import { Typography } from '@/components/atoms/Typography';

interface StateViewProps {
  message: string;
  variant?: 'default' | 'error';
}

export const StateView = ({ message, variant = 'default' }: StateViewProps) => {
  return (
    <View className="flex-1 items-center justify-center">
      <Typography 
        variant="body-base-regular" 
        className={variant === 'error' ? 'text-status-error' : ''}
      >
        {message}
      </Typography>
    </View>
  );
};
