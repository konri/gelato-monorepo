/** `{ pl, en, ua }` texts of a tenant field (titleLocal …). */
export type TenantText = Record<string, string | null | undefined> | null;

/** A reward of the brand's catalog (PrizeType). */
export type BrandReward = {
  id: string;
  title: string;
  titleLocal?: TenantText;
  pointsCost: number;
  imageUrl?: string | null;
  /** null = unlimited. */
  quantity?: number | null;
  claimed?: number;
  isActive?: boolean;
  validFrom?: string | null;
  validUntil?: string | null;
};

/** A reward a customer claimed (UserPrizeType). */
export type CustomerReward = {
  id: string;
  qrCode: string;
  claimedAt: string;
  validUntil: string;
  isExpired: boolean;
  isRedeemed: boolean;
  isRedeemableNow: boolean;
  redeemedAt?: string | null;
  redeemedAtSpot?: { id: string; name: string } | null;
  prize: Pick<BrandReward, 'id' | 'title' | 'titleLocal' | 'pointsCost' | 'imageUrl'>;
};

/** The customer's card at the spot's brand (LoyaltyCustomerType): this brand's numbers only. */
export type LoyaltyCard = {
  id: string;
  name?: string | null;
  loyaltyCode?: string | null;
  profilePicture?: string | null;
  availablePoints: number;
  totalPoints: number;
  /** Rewards the points cover now. */
  availablePrizes: number;
  brandId?: string | null;
  brandName?: string | null;
  spotId?: string | null;
  readyToPickUpCount: number;
  /** Counter-award multiplier active now (e.g. 200 = ×2); null when there is none. */
  activeMultiplierPercent?: number | null;
  /** Claimed in the app, ready to hand over here. */
  readyRewards: CustomerReward[];
  /** Rewards on offer that the points cover now, cheapest first (A3 counter exchange). */
  affordableRewards: BrandReward[];
};

export type ScanKind = 'CUSTOMER' | 'REWARD' | 'UNKNOWN';

export type ScanReason =
  | 'BRAND_INACTIVE'
  | 'CUSTOMER_NOT_FOUND'
  | 'REWARD_EXPIRED'
  | 'REWARD_INVALID'
  | 'REWARD_USED'
  | 'REWARD_WRONG_BRAND'
  | 'SPOT_INACTIVE';

export type StaffScanResult = {
  kind: ScanKind;
  normalizedCode?: string | null;
  reason?: ScanReason | null;
  /** REWARD only: true when the reward can be handed over at this spot now. */
  rewardUsableHere?: boolean | null;
  /** REWARD only; never set for another brand's reward. */
  reward?: CustomerReward | null;
  /** CUSTOMER: the scanned card. REWARD: the reward owner's card. */
  customer?: LoyaltyCard | null;
};

export type BrandPromotion = {
  taskId: string;
  title: string;
  titleLocal?: TenantText;
  multiplierPercent: number;
  isActiveNow: boolean;
  /** null while active = no end in sight. */
  activeUntil?: string | null;
  nextStartsAt?: string | null;
  appliesToOrders: boolean;
  appliesToTemplateAwards: boolean;
};

export type StaffAwardResult = {
  awardedPoints: number;
  basePoints: number;
  multiplierPercent: number;
  /** The customer's balance at the brand after the award. */
  brandAvailablePoints: number;
  /** The same requestId was already recorded: nothing was added twice. */
  duplicate: boolean;
  transactionId?: string | null;
  brand: { id: string; name: string };
};

export type AwardLoyaltyPointsInput = {
  spotId: string;
  /** User id or any form of the card. */
  customer: string;
  templateId?: string;
  quantity?: number;
  points?: number;
  description?: string;
  requestId: string;
};

export type CounterExchangeResult = {
  brandAvailablePoints: number;
  brandId: string;
  brandName: string;
  duplicate: boolean;
  pointsSpent: number;
  transactionId: string;
  userPrize: CustomerReward;
  /** The refreshed card. */
  customer?: LoyaltyCard | null;
};

export type PickupElsewhere = {
  orderId: string;
  orderNumber: string;
  spotId: string;
  spotName: string;
  spotAddress: string;
};
