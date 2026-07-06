import { useCategories } from '@/hooks/useCategories';
import { FilterModalData } from '@/shared/types/filterModal';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { CategorySection } from './CategorySection';
import { CheckboxSection } from './CheckboxSection';
import { DistanceSection } from './DistanceSection';
import { FilterModal } from './FilterModal';
import { SortSection } from './SortSection';

interface FiltersModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: () => void;
  onReset: () => void;
  draftFilters: FilterModalData;
  sortOnly?: boolean;
}

export const FiltersModal: React.FC<FiltersModalProps> = ({
  visible,
  onClose,
  onApply,
  onReset,
  draftFilters,
  sortOnly = false,
}) => {
  const { t } = useTranslation();
  const { data: categoriesData } = useCategories();
  const { state, actions, resultsCount, isLoadingCount } = draftFilters;

  const challengeOptions = [
    { id: 'challenges', label: t('Filters.showOnlyPlacesWithChallenges') },
  ];

  const loyaltyOptions = [
    { id: 'stamps', label: t('Filters.stampCards') },
    { id: 'points', label: t('Filters.points') },
  ];

  return (
    <FilterModal
      visible={visible}
      onClose={onClose}
      onApply={onApply}
      onReset={onReset}
      sortOnly={sortOnly}
      resultsCount={resultsCount}
      isLoadingCount={isLoadingCount}
      sortingSection={
        <SortSection
          sortOrder={state.sortOrder}
          onSortChange={actions.setSortOrder}
          variant={sortOnly ? 'list' : 'dropdown'}
          onClose={sortOnly ? onClose : undefined}
        />
      }
      filteringSection={
        sortOnly ? null : (
          <View>
            <CategorySection
              categories={categoriesData?.items || []}
              selectedIds={state.selectedCategories}
              onChange={actions.setSelectedCategories}
            />
            <DistanceSection value={state.maxDistance} onChange={actions.setMaxDistance} />
            <CheckboxSection
              title={t('Filters.challenges')}
              options={challengeOptions}
              selectedIds={state.showChallenges ? ['challenges'] : []}
              onSelectionChange={(ids) => actions.setShowChallenges(ids.includes('challenges'))}
            />
            <CheckboxSection
              title={t('Filters.loyaltyPrograms')}
              options={loyaltyOptions}
              selectedIds={state.loyaltyPrograms}
              onSelectionChange={actions.setLoyaltyPrograms}
            />
          </View>
        )
      }
    />
  );
};
