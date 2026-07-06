import { useCategories } from '@/hooks/useCategories';
import { useCurrentLocation } from '@/hooks/useCurrentLocation';
import { useUserContext } from '@/hooks/useUserContext';
import { DEFAULT_SEARCH_RADIUS_KM } from '@/shared/constants/filters';
import { SearchSortOrder } from '@/shared/enums/SearchSortOrder';
import { Category } from '@/shared/types/category';
import { UnifiedSearchInput } from '@/shared/types/filters';
import { useCallback, useMemo, useState } from 'react';

export interface FilterState {
  sortOrder: SearchSortOrder;
  selectedCategories: string[];
  maxDistance: number;
  showChallenges: boolean;
  loyaltyPrograms: string[];
  searchQuery: string;
}

const DEFAULT_FILTERS: FilterState = {
  sortOrder: SearchSortOrder.DISTANCE,
  selectedCategories: [],
  maxDistance: DEFAULT_SEARCH_RADIUS_KM,
  showChallenges: false,
  loyaltyPrograms: [],
  searchQuery: '',
};

export interface FiltersLogicData {
  city: string;
  userLocation: { latitude: number; longitude: number } | null;
  locationLoading: boolean;
  categoriesData: { items: Category[]; total: number } | null | undefined;
  appliedFilters: FilterState;
  draftFilters: FilterState;
  searchInput: UnifiedSearchInput;
  draftSearchInput: UnifiedSearchInput;
}

export interface FiltersLogicActions {
  buildSearchInput: (filters: FilterState, additionalInput?: Partial<UnifiedSearchInput>) => UnifiedSearchInput;
  applyFilters: () => void;
  resetFilters: () => void;
  syncDraftFilters: () => void;
  updateAppliedFilter: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void;
  updateDraftFilter: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void;
  removeFilter: (filterId: string) => void;
  clearAllFilters: () => void;
}

export interface FiltersLogicResult {
  data: FiltersLogicData;
  actions: FiltersLogicActions;
}

export const useFiltersLogic = (): FiltersLogicResult => {
  const { city } = useUserContext({ includeCity: true });
  const { location: userLocation, loading: locationLoading } = useCurrentLocation();
  const { data: categoriesData } = useCategories();

  const [appliedFilters, setAppliedFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [draftFilters, setDraftFilters] = useState<FilterState>(DEFAULT_FILTERS);

  const categoriesMap = useMemo(() => {
    if (!categoriesData?.items) return {} as Record<string, string>;
    return Object.fromEntries(categoriesData.items.map((cat) => [cat.id, cat.slug]));
  }, [categoriesData]);

  const buildSearchInput = useCallback((filters: FilterState, additionalInput?: Partial<UnifiedSearchInput>): UnifiedSearchInput => {
    const input: UnifiedSearchInput = {};

    if (userLocation) {
      input.location = {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        radiusKm: filters.maxDistance,
      };
    } else if (city) {
      input.search = { city };
    }

    if (filters.searchQuery) {
      if (!input.search) input.search = {};
      input.search.searchText = filters.searchQuery;
    }

    if (filters.selectedCategories.length > 0) {
      const categorySlugs = filters.selectedCategories
        .map((id) => categoriesMap[id])
        .filter((slug): slug is string => Boolean(slug));

      if (categorySlugs.length > 0) {
        input.category = { categorySlugs };
      }
    }

    input.sort = { sortBy: filters.sortOrder };

    return { ...input, ...additionalInput };
  }, [userLocation, city, categoriesMap]);

  const searchInput = useMemo(
    () => buildSearchInput(appliedFilters),
    [buildSearchInput, appliedFilters]
  );

  const draftSearchInput = useMemo(
    () => buildSearchInput(draftFilters),
    [buildSearchInput, draftFilters]
  );

  const applyFilters = useCallback(() => {
    setAppliedFilters(draftFilters);
  }, [draftFilters]);

  const resetFilters = useCallback(() => {
    setAppliedFilters(DEFAULT_FILTERS);
    setDraftFilters(DEFAULT_FILTERS);
  }, []);

  const syncDraftFilters = useCallback(() => {
    setDraftFilters(appliedFilters);
  }, [appliedFilters]);

  const updateAppliedFilter = useCallback(<K extends keyof FilterState>(
    key: K,
    value: FilterState[K]
  ) => {
    setAppliedFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const updateDraftFilter = useCallback(<K extends keyof FilterState>(
    key: K,
    value: FilterState[K]
  ) => {
    setDraftFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const removeFilter = useCallback((filterId: string) => {
    const separatorIndex = filterId.indexOf('-');
    if (separatorIndex === -1) return;

    const type = filterId.substring(0, separatorIndex);
    const value = filterId.substring(separatorIndex + 1);

    setAppliedFilters(prev => {
      switch (type) {
        case 'category':
          return { ...prev, selectedCategories: prev.selectedCategories.filter(id => id !== value) };
        case 'distance':
          return { ...prev, maxDistance: DEFAULT_SEARCH_RADIUS_KM };
        case 'challenges':
          return { ...prev, showChallenges: false };
        case 'loyalty':
          return { ...prev, loyaltyPrograms: prev.loyaltyPrograms.filter(p => p !== value) };
        case 'search':
          return { ...prev, searchQuery: '' };
        default:
          return prev;
      }
    });
  }, []);

  const clearAllFilters = useCallback(() => {
    setAppliedFilters(DEFAULT_FILTERS);
  }, []);

  return {
    data: {
      city,
      userLocation,
      locationLoading,
      categoriesData,
      appliedFilters,
      draftFilters,
      searchInput,
      draftSearchInput,
    },
    actions: {
      buildSearchInput,
      applyFilters,
      resetFilters,
      syncDraftFilters,
      updateAppliedFilter,
      updateDraftFilter,
      removeFilter,
      clearAllFilters,
    },
  };
};
