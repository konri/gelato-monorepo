import { Typography } from '@/components/atoms/Typography';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, View } from 'react-native';
import { FilterChip } from './FilterChip';
import { SortDropdown } from './SortDropdown';
import { ActiveFiltersBarProps } from './types';

export const ActiveFiltersBar: React.FC<ActiveFiltersBarProps> = ({
  currentSort,
  availableSortOptions,
  activeFilters,
  activeFiltersCount,
  onSortChange,
  onRemoveFilter,
  onClearAll,
  onOpenFilters,
}) => {
  const { t } = useTranslation();

  return (
    <View className="bg-white px-4 py-3 border-b border-gray-200">
      <View className="flex-row justify-between items-center">
        <SortDropdown
          currentSort={currentSort}
          availableSortOptions={availableSortOptions}
          onSortChange={onSortChange}
        />

        <Pressable
          onPress={onOpenFilters}
          className="bg-accent px-4 py-2.5 rounded-lg relative"
        >
          <Typography variant="body-small-semibold" className="text-white">
            🎯 {t('Merchants.filters')}
          </Typography>
          {activeFiltersCount > 0 && (
            <View className="absolute -top-1.5 -right-1.5 bg-red-500 rounded-full min-w-5 h-5 items-center justify-center px-1.5">
              <Typography variant="body-small-semibold" className="text-white" style={{ fontSize: 11 }}>
                {activeFiltersCount}
              </Typography>
            </View>
          )}
        </Pressable>
      </View>

      {activeFilters.length > 0 && (
        <View className="mt-3">
          <Typography variant="body-small-semibold" className="text-gray-500 mb-2">
            {t('ActiveFilters.label')}:
          </Typography>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
            {activeFilters.map((filter) => (
              <FilterChip
                key={filter.id}
                icon={filter.icon}
                label={filter.label}
                onRemove={() => onRemoveFilter(filter.id)}
              />
            ))}
            <Pressable onPress={onClearAll} className="px-3 py-1.5 justify-center">
              <Typography variant="body-small-semibold" className="text-red-500">
                {t('ActiveFilters.clearAll')}
              </Typography>
            </Pressable>
          </ScrollView>
        </View>
      )}
    </View>
  );
};

export * from './types';
