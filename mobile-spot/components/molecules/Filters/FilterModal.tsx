import { Button } from '@/components/atoms/Button';
import { Typography } from '@/components/atoms/Typography';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, ScrollView, View } from 'react-native';

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: () => void;
  onReset: () => void;
  sortingSection?: React.ReactNode;
  filteringSection?: React.ReactNode;
  sortOnly?: boolean;
  resultsCount?: number | null;
  isLoadingCount?: boolean;
}

export const FilterModal: React.FC<FilterModalProps> = ({
  visible,
  onClose,
  onApply,
  onReset,
  sortingSection,
  filteringSection,
  sortOnly = false,
  resultsCount,
  isLoadingCount = false,
}) => {
  const { t } = useTranslation();

  const getButtonText = () => {
    if (isLoadingCount) return '...';
    if (resultsCount !== null && resultsCount !== undefined) {
      return t('Filters.seeResults', { count: resultsCount });
    }
    return t('Filters.apply');
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View className="flex-1 bg-black/50 items-center justify-center">
        <Pressable className="absolute inset-0" onPress={onClose} />
        <View className="bg-white rounded-3xl w-[90%] h-[70%]">
          <View className="flex-row items-center justify-end p-4">
            <Pressable onPress={onClose}>
              <Ionicons name="close" size={24} color="#212121" />
            </Pressable>
          </View>

          <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
            {sortingSection && (
              <View className={filteringSection ? "pb-4 border-b border-gray-200" : "pb-4"}>
                <Typography variant="body-regular-bold" className="text-gray-500 mb-3">
                  {t('Filters.sorting')}
                </Typography>
                {sortingSection}
              </View>
            )}

            {filteringSection && (
              <View className="pt-4">
                <Typography variant="body-regular-bold" className="text-gray-500 mb-3">
                  {t('Filters.filtering')}
                </Typography>
                {filteringSection}
              </View>
            )}
          </ScrollView>

          {!sortOnly && (
            <View className="flex-row gap-2 p-4 border-t border-gray-200">
              <View className="flex-[3]">
                <Button onPress={onReset} title={t('Filters.resetFilters')} variant="ghost" />
              </View>
              <View className="flex-[7]">
                <Button onPress={onApply} title={getButtonText()} variant="primary" />
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};
