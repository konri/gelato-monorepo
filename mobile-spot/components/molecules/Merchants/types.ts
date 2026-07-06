export interface StoreCardProps {
  item: any;
  onPress?: (storeId: string) => void;
}

export interface MerchantsListProps {
  stores: any[];
  loading: boolean;
  error: string | null;
  emptyMessage?: string;
}

export interface MerchantsHeaderProps {
  city: string;
  activeFiltersCount?: number;
  sortType: 'nearest' | 'alphabetical';
  onSortChange: (type: 'nearest' | 'alphabetical') => void;
}
