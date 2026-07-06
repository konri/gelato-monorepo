import React from 'react';
import { Pressable, View } from 'react-native';
import { Typography } from './Typography';
import { Ionicons } from '@expo/vector-icons';

type DropdownItemPosition = 'first' | 'middle' | 'last';

interface DropdownItemProps {
  label: string;
  onPress?: () => void;
  position?: DropdownItemPosition;
  value?: string;
  iconName?: keyof typeof Ionicons.glyphMap;
  destructive?: boolean;
  showChevron?: boolean;
}

export const DropdownItem = ({
  label,
  onPress,
  position = 'middle',
  value,
  iconName,
  destructive = false,
  showChevron = true,
}: DropdownItemProps) => {
  const getBorderRadius = () => {
    if (position === 'first') return 'rounded-t-24px';
    if (position === 'last') return 'rounded-b-24px';
    return '';
  };

  return (
    <Pressable onPress={onPress}>
      <View className={`bg-white px-6 py-4 flex-row items-center justify-between border-b border-gray-200 ${getBorderRadius()}`}>
        <View className="flex-row items-center flex-1">
          {iconName && (
            <Ionicons
              name={iconName}
              size={20}
              color={destructive ? '#EF4444' : '#212121'}
              style={{ marginRight: 12 }}
            />
          )}
          <Typography
            variant="body-base-regular"
            className={destructive ? 'text-red-500' : ''}
          >
            {label}
          </Typography>
        </View>
        <View className="flex-row items-center">
          {value ? (
            <Typography variant="body-base-regular" className="text-gray-400 mr-2">
              {value}
            </Typography>
          ) : null}
          {showChevron && (
            <Ionicons
              name="chevron-forward"
              size={24}
              color={destructive ? '#EF4444' : '#212121'}
            />
          )}
        </View>
      </View>
    </Pressable>
  );
};
