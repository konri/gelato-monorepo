import { useActiveFilters } from '@/hooks/useActiveFilters';
import { useFilterResultsCount } from '@/hooks/useFilterResultsCount';
import { useFiltersLogic } from '@/hooks/useFiltersLogic';
import { useUnifiedSearch } from '@/hooks/useUnifiedSearch';
import { buildDraftFiltersData } from '@/hooks/utils/buildDraftFiltersData';
import { StreakStoreResult } from '@/shared/api-client/src/graphql/queries/unifiedSearch/types';
import { useMemo } from 'react';

interface UseStreakFiltersProps {
  isFiltersModalVisible?: boolean;
}

export const useStreakFilters = ({ isFiltersModalVisible = false }: UseStreakFiltersProps = {}) => {
  const { data, actions } = useFiltersLogic();

  const { streakStores, isLoading, isLoadingMore, loadMore } = useUnifiedSearch({
    input: data.searchInput,
    enabled: !data.locationLoading,
    pageSize: 10,
  });

  const { result: filterResult, isLoading: isLoadingCount } = useFilterResultsCount({
    input: data.draftSearchInput,
    enabled: isFiltersModalVisible,
  });

  const { activeStreaks, notStarted } = useMemo(() => {
    const active: StreakStoreResult[] = [];
    const notStartedList: StreakStoreResult[] = [];

    streakStores.forEach((item) => {
      if (item.streak.currentStreak > 0) {
        active.push(item);
      } else {
        notStartedList.push(item);
      }
    });

    return { activeStreaks: active, notStarted: notStartedList };
  }, [streakStores]);

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
    filterResult?.streakStores?.length,
    isLoadingCount
  );

  return {
    filters: {
      ...data.appliedFilters,
      activeFilters,
      activeFiltersCount,
    },
    data: {
      activeStreaks,
      notStarted,
      isLoading: isLoading || data.locationLoading,
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
