import React from 'react';
import { View } from 'react-native';
import { Typography } from '@/components/atoms/Typography';

interface StepItemProps {
  number: number;
  text: string;
  isLast?: boolean;
}

export const StepItem = ({ number, text, isLast }: StepItemProps) => (
  <View className={`flex-row items-center ${isLast ? 'mb-4' : 'mb-2'}`}>
    <View className="w-6 h-6 bg-background-lightGray rounded-full items-center justify-center mr-3">
      <Typography variant="body-small-bold" className="text-black">
        {number}
      </Typography>
    </View>
    <Typography variant="body-small-regular" className="flex-1">
      {text}
    </Typography>
  </View>
);