import type { LocalizedText } from '../tastes/types';

/** `BrandSummary` as reward screens select it. */
export type RewardBrand = {
  id: string;
  name: string;
  logoUrl?: string | null;
  /** False: the brand is paused (claimed rewards keep a 30-day grace). */
  isActive: boolean;
};

/** A reward of a brand's catalog (`PrizeType`). */
export type Prize = {
  id: string;
  brandId: string;
  title: string;
  titleLocal: LocalizedText;
  description?: string | null;
  descriptionLocal?: LocalizedText;
  imageUrl?: string | null;
  pointsCost: number;
  quantity?: number | null;
  claimed: number;
  isActive: boolean;
  archivedAt?: string | null;
  validFrom?: string | null;
  validUntil?: string | null;
  brand: RewardBrand;
};

/** A claimed reward with its `PR-` code (`UserPrizeType`). */
export type UserPrize = {
  id: string;
  brandId: string;
  qrCode: string;
  isRedeemed: boolean;
  redeemedAt?: string | null;
  claimedAt: string;
  validUntil: string;
  isExpired: boolean;
  /** Unredeemed, unexpired, not refunded, brand active or in its grace period. */
  isRedeemableNow: boolean;
  brand: RewardBrand;
  redeemedAtSpot?: { id: string; name: string } | null;
  prize: Pick<
    Prize,
    'id' | 'brandId' | 'title' | 'titleLocal' | 'description' | 'descriptionLocal' | 'imageUrl' | 'pointsCost'
  >;
};

export type PrizeDetailResponse = { prize: Prize | null };
export type MyPrizesResponse = { myPrizes: UserPrize[] };
export type MyPrizeResponse = { myPrize: UserPrize | null };

export type MyPrizesVariables = {
  brandId?: string | null;
  includeRedeemed?: boolean;
};
