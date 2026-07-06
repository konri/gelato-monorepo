import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Typography } from './Typography';

interface LoadingStateProps {
  title?: string;
  className?: string;
}

export const LoadingState = ({ title, className }: LoadingStateProps) => {
  return (
    <View className={className}>
      {title && (
        <Typography variant="body-lg-bold" className="mb-4">
          {title}
        </Typography>
      )}
      <View className="items-center justify-center py-8">
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    </View>
  );
};
