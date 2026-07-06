import { SearchSortOrder } from '@/shared/enums/SearchSortOrder';

export const SORT_ICONS: Record<SearchSortOrder, string> = {
  DISTANCE: '📍',
  ALPHABETICAL: '🔤',
  ALPHABETICAL_DESC: '🔤',
  PRIORITY: '⭐',
  NEWEST: '🆕',
  OLDEST: '📅',
  POINTS_ASC: '💰',
  POINTS_DESC: '💰',
  EXPIRING_SOON: '⏰',
  POPULARITY: '📊',
};

export const getSortIcon = (sort: SearchSortOrder): string => {
  return SORT_ICONS[sort] || '📊';
};
