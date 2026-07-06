import { useActiveFilters } from '@/hooks/useActiveFilters';
import { useFilterResultsCount } from '@/hooks/useFilterResultsCount';
import { useFiltersLogic } from '@/hooks/useFiltersLogic';
import { useUnifiedSearch } from '@/hooks/useUnifiedSearch';
import { buildDraftFiltersData } from '@/hooks/utils/buildDraftFiltersData';
import { useMemo } from 'react';

interface UseStampCardFiltersProps {
  isFiltersModalVisible?: boolean;
}

export const useStampCardFilters = ({ isFiltersModalVisible = false }: UseStampCardFiltersProps = {}) => {
  const { data, actions } = useFiltersLogic();

  const { stampCardStores, isLoading, isLoadingMore, loadMore } = useUnifiedSearch({
    input: data.searchInput,
    enabled: !data.locationLoading,
    pageSize: 10,
  });

  const { result: filterResult, isLoading: isLoadingCount } = useFilterResultsCount({
    input: data.draftSearchInput,
    enabled: isFiltersModalVisible,
  });

  const { collectedByMerchant, availableByMerchant } = useMemo(() => {
    const collected: typeof stampCardStores = [];
    const available: typeof stampCardStores = [];

    stampCardStores.forEach((store) => {
      if (store.stampCardProgress.hasCard) {
        collected.push(store);
      } else {
        available.push(store);
      }
    });

    const groupByMerchant = (stores: typeof stampCardStores) => {
      const groups = new Map<string, { merchant: any; stampCards: typeof stampCardStores }>();
      stores.forEach((store) => {
        const merchantId = store.merchant?.id || 'unknown';
        if (!groups.has(merchantId)) {
          groups.set(merchantId, { merchant: store.merchant, stampCards: [] });
        }
        groups.get(merchantId)!.stampCards.push(store);
      });
      return Array.from(groups.values());
    };

    return {
      collectedByMerchant: groupByMerchant(collected),
      availableByMerchant: groupByMerchant(available),
    };
  }, [stampCardStores]);

  const { activeFilters, activeFiltersCount } = useActiveFilters({
    selectedCategories: data.appliedFilters.selectedCategories,
    maxDistance: data.appliedFilters.maxDistance,
    showChallenges: data.appliedFilters.showChallenges,
    loyaltyPrograms: data.appliedFilters.loyaltyPrograms,
    searchQuery: data.appliedFilters.searchQuery,
    categoriesData: data.categoriesData || undefined,
  });

  const draftFilters = buildDraftFiltersData(
    data.draftFilters,
    actions,
    filterResult?.stampCardStores?.length,
    isLoadingCount
  );

  return {
    filters: {
      ...data.appliedFilters,
      activeFilters,
      activeFiltersCount,
    },
    data: {
      collectedByMerchant,
      availableByMerchant,
      city: data.city,
      isLoading: isLoading || data.locationLoading,
      isLoadingMore,
      draftFilters,
    },
    actions: {
      setSortOrder: (value: any) => actions.updateAppliedFilter('sortOrder', value),
      setSelectedCategories: (value: string[]) => actions.updateAppliedFilter('selectedCategories', value),
      setMaxDistance: (value: number) => actions.updateAppliedFilter('maxDistance', value),
      setShowChallenges: (value: boolean) => actions.updateAppliedFilter('showChallenges', value),
      setLoyaltyPrograms: (value: string[]) => actions.updateAppliedFilter('loyaltyPrograms', value),
      setSearchQuery: (value: string) => actions.updateAppliedFilter('searchQuery', value),
      applyFilters: actions.applyFilters,
      resetFilters: actions.resetFilters,
      syncDraftFilters: actions.syncDraftFilters,
      removeFilter: actions.removeFilter,
      clearAllFilters: actions.clearAllFilters,
      loadMore,
    },
  };
};
