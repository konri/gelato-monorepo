import { RoundedCard } from '@/components/atoms/RoundedCard';
import { Typography } from '@/components/atoms/Typography';
import { FilterModal } from '@/components/molecules/Filters/FilterModal';
import { SearchSortOrder } from '@/shared/enums/SearchSortOrder';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

interface SeeAllHeaderProps {
  activeFiltersCount?: number;
  renderSortContent: (onClose: () => void) => React.ReactNode;
  filtersModalContent?: React.ReactNode;
  showFilters?: boolean;
  onFiltersPress?: () => void;
  currentSort?: SearchSortOrder;
}

export const SeeAllHeader = ({
  activeFiltersCount = 0,
  renderSortContent,
  filtersModalContent,
  showFilters = true,
  onFiltersPress,
  currentSort,
}: SeeAllHeaderProps) => {
  const { t } = useTranslation();
  const [isSortVisible, setIsSortVisible] = useState(false);

  const sortLabel = currentSort
    ? t(`Filters.sort.${currentSort}`)
    : t('Sections.nearestToYou');

  return (
    <>
      <View className="flex-row items-center justify-between">
        <RoundedCard className="pr-6">
          <Pressable onPress={() => setIsSortVisible(true)} className="flex-row items-center gap-2">
            <Typography variant="body-base-semibold" className="text-text-primary">
              {sortLabel}
            </Typography>
            <Ionicons name="chevron-down" size={16} color="#919191" />
          </Pressable>
        </RoundedCard>
        {showFilters && (filtersModalContent || onFiltersPress) && (
          <RoundedCard className="ml-2">
            <Pressable className="flex-row items-center" onPress={onFiltersPress}>
              <Ionicons name="options-outline" size={24} color="#212121" />
              <Typography variant="body-small-semibold" className="ml-1 text-text-primary">
                {t('Merchants.filters')}
              </Typography>
              {activeFiltersCount > 0 && (
                <View className="ml-2 bg-red-500 rounded-full w-6 h-6 items-center justify-center">
                  <Typography variant="body-small-semibold" className="text-white">
                    {activeFiltersCount}
                  </Typography>
                </View>
              )}
            </Pressable>
          </RoundedCard>
        )}
      </View>

      <FilterModal
        visible={isSortVisible}
        onClose={() => setIsSortVisible(false)}
        onApply={() => setIsSortVisible(false)}
        onReset={() => setIsSortVisible(false)}
        sortOnly={true}
        sortingSection={renderSortContent(() => setIsSortVisible(false))}
      />
    </>
  );
};
