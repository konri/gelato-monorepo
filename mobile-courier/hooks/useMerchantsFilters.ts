import { useActiveFilters } from '@/hooks/useActiveFilters';
import { useFilterResultsCount } from '@/hooks/useFilterResultsCount';
import { useFiltersLogic } from '@/hooks/useFiltersLogic';
import { useUnifiedSearch } from '@/hooks/useUnifiedSearch';
import { buildDraftFiltersData } from '@/hooks/utils/buildDraftFiltersData';

export const useMerchantsFilters = (isFiltersModalVisible = false, pageSize = 10) => {
  const { data, actions } = useFiltersLogic();

  const { activeFilters, activeFiltersCount } = useActiveFilters({
    selectedCategories: data.appliedFilters.selectedCategories,
    maxDistance: data.appliedFilters.maxDistance,
    showChallenges: data.appliedFilters.showChallenges,
    loyaltyPrograms: data.appliedFilters.loyaltyPrograms,
    searchQuery: data.appliedFilters.searchQuery,
    categoriesData: data.categoriesData || undefined,
  });

  const { stores, stampCardStores, streakStores, isLoading, isLoadingMore, loadMore } = useUnifiedSearch({
    input: data.searchInput,
    enabled: !data.locationLoading && !!data.userLocation,
    pageSize,
  });

  const { result: filterResult, isLoading: isLoadingCount } = useFilterResultsCount({
    input: data.draftSearchInput,
    enabled: isFiltersModalVisible,
  });

  const draftFilters = buildDraftFiltersData(
    data.draftFilters,
    actions,
    filterResult?.stores?.length,
    isLoadingCount
  );

  return {
    filters: {
      ...data.appliedFilters,
      activeFilters,
      activeFiltersCount,
    },
    data: {
      stores,
      stampCardStores,
      streakStores,
      city: data.city,
      isLoading: isLoading || data.locationLoading || !data.userLocation,
      isLoadingMore,
      draftFilters,
    },
    actions: {
      setSortOrder: (value: any) => actions.updateAppliedFilter('sortOrder', value),
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
