import type { LocalizedText } from '../tastes/types';

/**
 * Per-brand loyalty types (BRANDS_SPEC §5.2, schema.gql `LoyaltyOverview`).
 * Customer-facing copy never names a brand with a generic noun (A4): always
 * use `brand.name`.
 */

export type LoyaltyLanguage = 'EN' | 'PL' | 'UA';

export type LoyaltyCity = {
  id: string;
  name: string;
  nameLocal?: LocalizedText;
};

/** `Brand` fields every loyalty screen needs (fragment WalletBrandFields). */
export type WalletBrand = {
  id: string;
  name: string;
  logoUrl?: string | null;
  description?: string | null;
  descriptionLocal?: LocalizedText;
  isActive: boolean;
  cityIds: string[];
  rewardCount: number;
  birthdayBonusPoints: number;
  referralBonusPoints: number;
};

export type BrandPromotionWindow = {
  /** ISO day of week, 1 = Monday … 7 = Sunday. */
  dayOfWeek: number;
  /** "HH:MM" in `timezone`. */
  startTime: string;
  /** "HH:MM" or "24:00" in `timezone`. */
  endTime: string;
};

export type BrandPromotion = {
  taskId: string;
  brandId: string;
  brandName: string;
  title: string;
  titleLocal?: LocalizedText;
  description?: string | null;
  descriptionLocal?: LocalizedText;
  /** 200 = double points. */
  multiplierPercent: number;
  isActiveNow: boolean;
  activeUntil?: string | null;
  nextStartsAt?: string | null;
  /** IANA zone the windows are written in. */
  timezone: string;
  windows: BrandPromotionWindow[];
  /** Empty = every location of the brand. */
  spotIds: string[];
  spotNames: string[];
  startsOn?: string | null;
  endsOn?: string | null;
  appliesToOrders: boolean;
  appliesToTemplateAwards: boolean;
};

export type RewardSummary = {
  id: string;
  title: string;
  titleLocal?: LocalizedText;
  imageUrl?: string | null;
  pointsCost: number;
};

export type LoyaltyWallet = {
  brand: WalletBrand;
  hasWallet: boolean;
  /** The brand is deactivated: points are kept, nothing can be earned or spent. */
  paused: boolean;
  availablePoints: number;
  totalPoints: number;
  readyToPickUpCount: number;
  affordableRewardCount: number;
  inMyCity: boolean;
  lastActivityAt?: string | null;
  nextReward?: RewardSummary | null;
  pointsToNextReward?: number | null;
  activePromotion?: BrandPromotion | null;
};

/** A claimed reward waiting to be picked up (any brand). Never persisted with `qrCode`. */
export type ReadyToPickUpItem = {
  id: string;
  brandId: string;
  qrCode?: string;
  claimedAt: string;
  validUntil: string;
  isExpired: boolean;
  isRedeemableNow: boolean;
  brand: { id: string; name: string; logoUrl?: string | null; isActive: boolean };
  prize: RewardSummary;
};

export type LoyaltyOverview = {
  cityId?: string | null;
  city?: LoyaltyCity | null;
  defaultBrandId?: string | null;
  engagedBrandCount: number;
  showPointsPicker: boolean;
  showRewardsPicker: boolean;
  /** Server order: paused last, then points, ready rewards, wallet, my city, name. */
  wallets: LoyaltyWallet[];
  readyToPickUp: ReadyToPickUpItem[];
};

export type LoyaltyMe = {
  id: string;
  firstName?: string | null;
  loyaltyCode?: string | null;
  preferredCityId?: string | null;
  language?: LoyaltyLanguage | null;
};

export type LoyaltyOverviewData = {
  me: LoyaltyMe;
  overview: LoyaltyOverview;
};

export type LoyaltyOverviewResponse = {
  me: LoyaltyMe;
  myLoyaltyOverview: LoyaltyOverview;
};

export type LoyaltyOverviewVariables = {
  /** An explicit city choice; wins over the profile city. */
  cityId?: string | null;
  /** Used only when the profile has no city (device-stored city). */
  fallbackCityId?: string | null;
};

/** `brandsInCity(cityId)` row (discovery lists). */
export type CityBrand = WalletBrand & {
  spotCount: number;
  activePromotions: BrandPromotion[];
};

export type BrandsInCityResponse = { brandsInCity: CityBrand[] };

export type BrandLocation = {
  id: string;
  name: string;
  address: string;
  cityId: string;
  latitude: number;
  longitude: number;
  logoUrl?: string | null;
  isActive: boolean;
  openingHours?: unknown;
};

/** `brand(id)` for the brand page. */
export type BrandDetail = WalletBrand & {
  coverUrl?: string | null;
  cities: LoyaltyCity[];
  spots: BrandLocation[];
  activePromotions: BrandPromotion[];
};

export type BrandDetailResponse = { brand: BrandDetail | null };

/** `prizes(brandId)` row: a brand's reward catalog. */
export type BrandReward = RewardSummary & {
  brandId: string;
  description?: string | null;
  descriptionLocal?: LocalizedText;
  quantity?: number | null;
  claimed: number;
  isActive: boolean;
  archivedAt?: string | null;
  validFrom?: string | null;
  validUntil?: string | null;
};

export type BrandRewardsResponse = { prizes: BrandReward[] };

/** `brand(id)` with only what a label needs. */
export type BrandSummaryLite = {
  id: string;
  name: string;
  logoUrl?: string | null;
  isActive: boolean;
};

export type BrandSummaryResponse = { brand: BrandSummaryLite | null };
