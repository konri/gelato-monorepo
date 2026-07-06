import React from 'react';
import { View, Text } from 'react-native';

interface AuthDividerProps {
  text: string;
}

export const AuthDivider = ({ text }: AuthDividerProps) => (
  <View className="flex-row items-center mb-6">
    <View className="flex-1 h-px bg-gray-300" />
    <Text className="mx-4 text-gray-500 text-sm" style={{ fontFamily: 'Urbanist' }}>
      {text}
    </Text>
    <View className="flex-1 h-px bg-gray-300" />
  </View>
);
