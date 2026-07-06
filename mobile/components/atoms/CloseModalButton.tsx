import React from 'react';
import { TouchableOpacity } from 'react-native';
import { Typography } from '@/components/atoms/Typography';

interface CloseModalButtonProps {
  onPress: () => void;
}

export function CloseModalButton({ onPress }: CloseModalButtonProps) {
  return (
    <TouchableOpacity onPress={onPress} className="w-14 h-14 bg-white rounded-full items-center justify-center">
      <Typography variant="body-xl-bold">✕</Typography>
    </TouchableOpacity>
  );
}