import { FiltersLogicActions, FilterState } from '@/hooks/useFiltersLogic';
import { FilterModalData } from '@/shared/types/filterModal';

export function buildDraftFiltersData(
  draftFilters: FilterState,
  actions: FiltersLogicActions,
  resultsCount: number | null | undefined,
  isLoadingCount: boolean
): FilterModalData {
  return {
    state: {
      sortOrder: draftFilters.sortOrder,
      selectedCategories: draftFilters.selectedCategories,
      maxDistance: draftFilters.maxDistance,
      showChallenges: draftFilters.showChallenges,
      loyaltyPrograms: draftFilters.loyaltyPrograms,
    },
    actions: {
      setSortOrder: (value) => actions.updateDraftFilter('sortOrder', value),
      setSelectedCategories: (value) => actions.updateDraftFilter('selectedCategories', value),
      setMaxDistance: (value) => actions.updateDraftFilter('maxDistance', value),
      setShowChallenges: (value) => actions.updateDraftFilter('showChallenges', value),
      setLoyaltyPrograms: (value) => actions.updateDraftFilter('loyaltyPrograms', value),
    },
    resultsCount: resultsCount ?? null,
    isLoadingCount,
  };
}
