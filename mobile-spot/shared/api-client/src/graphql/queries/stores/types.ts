import { ApolloServerConfig } from '../../types';

export type Promotion = {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  value?: number;
  pointsCost?: number;
};

export type StoreForMap = {
  id: string;
  name: string;
  address: string;
  phone: string;
  latitude: number;
  longitude: number;
  logoUrl?: string;
  images?: {
    url: string;
    type: string;
    alt: string;
  }[];
  category: {
    iconUrl?: string;
    iconPngUrl?: string;
    name: string;
  };
  merchant: {
    name: string;
  };
  availablePromotions?: {
    hasPromotions: boolean;
    vouchers?: {
      id: string;
      pointsCost?: number;
    }[];
    stampCards?: {
      id: string;
      stampsRequired?: number;
    }[];
  };
  isFavorite?: boolean;
  favoriteIconPngUrl?: string;
};

export type GetStoresForMapResponse = {
  getStoresForMap: StoreForMap[];
};

export type GetStoresForMapOptions = ApolloServerConfig;

export type StampCard = {
  current: number;
  required: number;
  reward: string;
  isUsed: boolean;
  isActive: boolean;
  canRedeem: boolean;
  canActivate: boolean | null;
  templateId: string | null;
};

export enum ActivityType {
  STAMP_CARD = 'STAMP_CARD',
  MILESTONE = 'MILESTONE',
  COUPON = 'COUPON',
  POINT_VOUCHER = 'POINT_VOUCHER',
  VOUCHER = 'VOUCHER'
}

export type RedeemableReward = {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  pointsCost?: number;
  userPoints?: number;
  pointsNeeded?: number;
  stampsCollected?: number;
  stampsRequired?: number;
  stampsNeeded?: number;
  canRedeem: boolean;
  stampCoverUrl?: string;
  stampStickerIconUrl?: string;
  imageUrl?: string;
};

export type StoreDetails = {
  id: string;
  name: string;
  description?: string;
  address: string;
  city: string;
  country?: string;
  postalCode?: string;
  phone: string;
  email?: string;
  openingHours?: string;
  latitude: number;
  longitude: number;
  logoUrl?: string;
  images?: {
    url: string;
    type: string;
    alt: string;
  }[];
  category?: {
    name: string;
    iconUrl?: string;
    iconPngUrl?: string;
  };
  merchant?: {
    name: string;
    description?: string;
  };
  stampCard?: {
    current: number;
    required: number;
    reward: string;
    isUsed: boolean;
    isActive: boolean;
    canRedeem: boolean;
    canActivate: boolean | null;
    templateId: string | null;
  };
  userPoints?: number;
  promotions?: Promotion[];
  redeemableRewards?: RedeemableReward[];
};

export type GetStoreDetailsResponse = {
  getStore: StoreDetails;
};

export type GetStoreDetailsOptions = ApolloServerConfig;

export type StampCardProgress = {
  hasCard: boolean;
  stampsCollected: number | null;
  stampsRequired: number | null;
  cardId: string | null;
};