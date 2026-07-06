import { SearchSortOrder } from '@/shared/enums/SearchSortOrder';

export interface ActiveFilter {
  id: string;
  type: 'displayType' | 'category' | 'points' | 'distance' | 'city' | 'search' | 'date' | 'discountType' | 'affordability' | 'challenges' | 'loyaltyPrograms';
  label: string;
  icon: string;
  value: any;
}

export interface ActiveFiltersBarProps {
  currentSort: SearchSortOrder;
  availableSortOptions: SearchSortOrder[];
  activeFilters: ActiveFilter[];
  activeFiltersCount: number;
  onSortChange: (sort: SearchSortOrder) => void;
  onRemoveFilter: (filterId: string) => void;
  onClearAll: () => void;
  onOpenFilters: () => void;
}
