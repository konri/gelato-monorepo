import { Typography } from '@/components/atoms/Typography';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

interface SortModalProps {
  sortType: 'nearest' | 'alphabetical';
  onSortChange: (type: 'nearest' | 'alphabetical') => void;
}

export const SortModal = ({ sortType, onSortChange }: SortModalProps) => {
  const { t } = useTranslation();

  return (
    <View className="p-4">
      <Pressable
        className="flex-row items-center justify-between py-3"
        onPress={() => onSortChange('nearest')}
      >
        <Typography variant="body-base-regular" className="text-text-primary">
          {t('Sections.nearestToYou')}
        </Typography>
        {sortType === 'nearest' && <Ionicons name="checkmark" size={24} color="#EA3A1D" />}
      </Pressable>

      <Pressable
        className="flex-row items-center justify-between py-3"
        onPress={() => onSortChange('alphabetical')}
      >
        <Typography variant="body-base-regular" className="text-text-primary">
          {t('Merchants.alphabetical')}
        </Typography>
        {sortType === 'alphabetical' && <Ionicons name="checkmark" size={24} color="#EA3A1D" />}
      </Pressable>
    </View>
  );
};
