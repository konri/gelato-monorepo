import { UnifiedSearchInput } from '@/shared/types/filters';

export interface CouponResult {
  coupon: {
    id: string;
    code?: string;
    title: string;
    description?: string;
    imageUrl?: string;
    displayType?: string;
    priority?: number;
    couponType?: string;
    availability?: string;
    pointsCost?: number;
    validFrom?: string;
    validUntil?: string;
    discountType?: string;
    discountValue?: number;
    buyQuantity?: number;
    getQuantity?: number;
    thresholdAmount?: number;
    discountAmount?: number;
    itemName?: string;
    dayOfWeek?: string;
  };
  merchant?: {
    id: string;
    name: string;
    slug?: string;
    logoUrl?: string;
  };
  distanceKm?: number;
}

export interface StoreResult {
  store: {
    id: string;
    name: string;
    slug?: string;
    address?: string;
    city?: string;
    latitude?: number;
    longitude?: number;
    images?: {
      url: string;
      type: string;
      alt: string;
    }[];
    category?: {
      iconPngUrl?: string;
      name?: string;
    };
  };
  merchant?: {
    id: string;
    name: string;
    slug?: string;
    logoUrl?: string;
  };
  distanceKm?: number;
  isFavorite?: boolean;
  favoriteIconUrl?: string;
  favoriteIconPngUrl?: string;
  hasStreak?: boolean;
  streakIconPngUrl?: string;
}

export interface StampCardProgress {
  hasCard: boolean;
  stampsCollected: number | null;
  stampsRequired: number | null;
  cardId: string | null;
}

export interface StampCardStoreResult {
  store: {
    id: string;
    name: string;
    address: string;
    city: string;
    images: {
      url: string;
      type: string;
      alt: string;
    }[];
    logoUrl: string | null;
  };
  merchant: {
    id: string;
    name: string;
    logoUrl: string | null;
    coverUrl: string | null;
  };
  distanceKm: number;
  stampIconUrl: string;
  stampCardProgress: StampCardProgress;
  hasStreak?: boolean;
}

export interface StreakInfo {
  streakProgramId: string;
  programName: string;
  currentStreak: number;
  requiredConsecutiveDays: number;
  claimableRewardsCount: number;
  streakingPolicy: 'DAILY' | 'WEEKLY' | 'MONTHLY';
}

export interface StreakStoreResult {
  store: {
    id: string;
    name: string;
    address: string;
    city: string;
    images: { url: string; type: string; alt: string }[];
  };
  merchant: {
    id: string;
    name: string;
    logoUrl: string | null;
  };
  distanceKm: number;
  streak: StreakInfo;
}

export interface UnifiedSearchResult {
  coupons: CouponResult[];
  stores: StoreResult[];
  stampCardStores: StampCardStoreResult[];
  streakStores: StreakStoreResult[];
  metadata: {
    totalResults: number;
    filteredResults: number;
  };
}

export interface UnifiedSearchResponse {
  unifiedSearch: UnifiedSearchResult;
}

export interface UnifiedSearchOptions extends ApolloServerConfig {
  input: UnifiedSearchInput;
  token?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
}

export interface FilterOptionsResponse {
  categories: Category[];
}
