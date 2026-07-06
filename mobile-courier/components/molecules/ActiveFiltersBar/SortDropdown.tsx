import { Typography } from '@/components/atoms/Typography';
import { getSortIcon } from '@/shared/constants/sortIcons';
import { SearchSortOrder } from '@/shared/enums/SearchSortOrder';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, ScrollView, View } from 'react-native';

interface SortDropdownProps {
  currentSort: SearchSortOrder;
  availableSortOptions: SearchSortOrder[];
  onSortChange: (sort: SearchSortOrder) => void;
}

export const SortDropdown: React.FC<SortDropdownProps> = ({
  currentSort,
  availableSortOptions,
  onSortChange,
}) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const sortIcon = getSortIcon(currentSort);
  const sortLabel = t(`Filters.sort.${currentSort}`);

  return (
    <View className="flex-1 mr-3">
      <Pressable
        onPress={() => setIsOpen(true)}
        className="flex-row items-center justify-between bg-gray-100 px-4 py-2.5 rounded-lg border border-gray-200"
      >
        <Typography variant="body-small-semibold" className="text-text-primary">
          {sortIcon} {sortLabel}
        </Typography>
        <Ionicons name="chevron-down" size={14} color="#666" />
      </Pressable>

      <Modal visible={isOpen} transparent animationType="fade" onRequestClose={() => setIsOpen(false)}>
        <Pressable className="flex-1 bg-black/50" onPress={() => setIsOpen(false)}>
          <View className="flex-1 justify-center px-6">
            <Pressable onPress={(e) => e.stopPropagation()}>
              <View className="bg-white rounded-2xl max-h-96">
                <ScrollView>
                  {availableSortOptions.map((option, index) => {
                    const optionIcon = getSortIcon(option);
                    const optionLabel = t(`Filters.sort.${option}`);
                    const isSelected = option === currentSort;

                    return (
                      <Pressable
                        key={option}
                        onPress={() => {
                          onSortChange(option);
                          setIsOpen(false);
                        }}
                        className={`px-4 py-4 border-b border-gray-200 flex-row items-center ${
                          index === 0 ? 'rounded-t-2xl' : ''
                        } ${index === availableSortOptions.length - 1 ? 'rounded-b-2xl border-b-0' : ''} ${
                          isSelected ? 'bg-blue-50' : ''
                        }`}
                      >
                        {isSelected && (
                          <Typography variant="body-base-semibold" className="text-accent mr-1">
                            ✓
                          </Typography>
                        )}
                        <Typography
                          variant={isSelected ? 'body-base-semibold' : 'body-base-regular'}
                          className={isSelected ? 'text-accent' : 'text-text-primary'}
                        >
                          {optionIcon} {optionLabel}
                        </Typography>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};
