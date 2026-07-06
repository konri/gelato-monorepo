import { SearchSortOrder } from '@/shared/enums/SearchSortOrder';

export interface FilterState {
  sortOrder: SearchSortOrder;
  selectedCategories: string[];
  maxDistance: number;
  showChallenges: boolean;
  loyaltyPrograms: string[];
}

export interface FilterActions {
  setSortOrder: (order: SearchSortOrder) => void;
  setSelectedCategories: (categories: string[]) => void;
  setMaxDistance: (distance: number) => void;
  setShowChallenges: (show: boolean) => void;
  setLoyaltyPrograms: (programs: string[]) => void;
}

export interface FilterModalData {
  state: FilterState;
  actions: FilterActions;
  resultsCount?: number | null;
  isLoadingCount?: boolean;
}

export interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: () => void;
  onReset: () => void;
  draftFilters: FilterModalData;
  sortOnly?: boolean;
}
