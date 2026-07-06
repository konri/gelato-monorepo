export type RewardValueType =
  | "FREE_SERVICE"
  | "DISCOUNT_PERCENT"
  | "DISCOUNT_AMOUNT"
  | "PRODUCT"
  | "POINTS"
  | "CASH_VOUCHER";

export type RewardSourceType =
  | "STAMP_CARD"
  | "POINTS"
  | "CASH"
  | "SUBSCRIPTION"
  | "REFERRAL"
  | "ACTIVITY";

export type Reward = {
  id: string;
  title: string;
  description?: string | null;
  imageUrl?: string | null;
  sourceType: RewardSourceType;
  valueType: RewardValueType;
  discountPercent?: number | null;
  discountAmount?: number | null;
  pointsValue?: number | null;
  productName?: string | null;
  isActive: boolean;
  availableStoreIds?: string[];
  merchant?: { id: string; logoUrl?: string | null } | null;
};

export type GetMyRewardsResponse = {
  myRewards: Reward[];
};

export type GetMyRewardsVariables = {
  storeId?: string;
};

export type GetAvailableMerchantRewardsVariables = {
  merchantId?: string;
  sourceType?: RewardSourceType;
  storeId?: string;
};

export type GetAvailableMerchantRewardsResponse = {
  availableRewards: Reward[];
};
