import { SearchSortOrder } from '../enums/SearchSortOrder';

export interface LocationFilter {
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
  minDistanceKm?: number;
  maxDistanceKm?: number;
}

export interface CategoryFilter {
  categoryIds?: string[];
  categorySlugs?: string[];
  categoryNames?: string[];
}

export interface PointsFilter {
  minPoints?: number;
  maxPoints?: number;
  onlyFree?: boolean;
}

export interface DateFilter {
  validFrom?: Date;
  validUntil?: Date;
  expiringInDays?: number;
}

export interface StampCardFilter {
  onlyActive?: boolean;
  minStampsRequired?: number;
  maxStampsRequired?: number;
  hasMilestones?: boolean;
  closeToReward?: boolean;
}

export interface CouponFilter {
  displayTypes?: string[];
  couponTypes?: string[];
  discountTypes?: string[];
  onlyUnused?: boolean;
  onlyAffordable?: boolean;
}

export interface SearchFilter {
  searchText?: string;
  city?: string;
  cities?: string[];
  onlyUserActive?: boolean;
}

export interface PaginationInput {
  page?: number;
  pageSize?: number;
  skip?: number;
  take?: number;
}

export interface SortInput {
  sortBy?: SearchSortOrder;
  reverse?: boolean;
}

export interface UnifiedSearchInput {
  location?: LocationFilter;
  category?: CategoryFilter;
  points?: PointsFilter;
  date?: DateFilter;
  stampCard?: StampCardFilter;
  coupon?: CouponFilter;
  search?: SearchFilter;
  sort?: SortInput;
  pagination?: PaginationInput;
}
