import React from 'react';
import { View } from 'react-native';
import { Typography } from '@/components/atoms/Typography';

interface AuthDividerProps {
  text: string;
}

export const AuthDivider = ({ text }: AuthDividerProps) => (
  <View className="flex-row items-center mb-6">
    <View className="flex-1 h-px bg-gray-300" />
    <Typography variant="text-12-regular" className="mx-4 text-gray-500">
      {text}
    </Typography>
    <View className="flex-1 h-px bg-gray-300" />
  </View>
);
