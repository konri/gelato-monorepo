import { Typography } from '@/components/atoms/Typography';
import React from 'react';
import { Pressable } from 'react-native';

interface FilterChipProps {
  icon: string;
  label: string;
  onRemove: () => void;
  onPress?: () => void;
}

export const FilterChip: React.FC<FilterChipProps> = ({ icon, label, onRemove, onPress }) => (
  <Pressable
    onPress={onPress}
    className="px-4 py-2 rounded-full border bg-white border-gray-300 mr-2 flex-row items-center"
  >
    <Typography variant="body-small-regular" className="text-text-primary">
      {label}
    </Typography>
    <Pressable
      onPress={(e) => {
        e.stopPropagation();
        onRemove();
      }}
      className="ml-2"
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <Typography variant="body-base-bold" className="text-text-primary">
        ×
      </Typography>
    </Pressable>
  </Pressable>
);
