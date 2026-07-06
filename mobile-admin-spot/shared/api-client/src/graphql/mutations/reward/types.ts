import type {
  Reward,
  RewardSourceType,
  RewardValueType,
} from "../../queries/myRewards";

export type CreateRewardInput = {
  merchantId?: string;
  title: string;
  description?: string;
  imageUrl?: string;
  sourceType: RewardSourceType;
  valueType: RewardValueType;
  discountPercent?: number;
  discountAmount?: number;
  pointsValue?: number;
  productName?: string;
  maxUsesPerUser?: number;
  totalQuantity?: number;
  validFrom?: string;
  validUntil?: string;
};

export type UpsertRewardStoreOverrideInput = {
  title?: string;
  description?: string;
  imageUrl?: string;
  isActive?: boolean;
  valueType?: RewardValueType;
  discountPercent?: number;
  discountAmount?: number;
  pointsValue?: number;
  productName?: string;
  maxUsesPerUser?: number;
  totalQuantity?: number;
  validFrom?: string;
  validUntil?: string;
};

export type CreateRewardResponse = {
  createReward: Reward;
};

export type CreateRewardVariables = {
  data: CreateRewardInput;
  storeId?: string;
};

export type UpdateRewardResponse = {
  updateReward: Reward;
};

export type UpsertRewardStoreOverrideResponse = {
  upsertRewardStoreOverride: Reward;
};
