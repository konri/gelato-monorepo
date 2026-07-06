import type { UserClaimedRewardStatus } from "../../queries/rewards";

export type ClaimRewardVariables = {
  userRewardId: string;
  storeId?: string;
};

export type ClaimRewardResponse = {
  claimUserReward: UserClaimedRewardStatus;
};

export type RedeemRewardVariables = {
  userRewardId: string;
  storeId: string;
};

export type RedeemRewardResponse = {
  redeemUserReward: UserClaimedRewardStatus;
};

export type AddStampByUserIdVariables = {
  userId: string;
  storeId: string;
  templateId?: string | null;
  description: string;
  count?: number;
};

export type StampAdded = {
  id: string;
  cardId: string;
  isUsed: boolean;
  createdAt: string;
};

export type AddStampByUserIdResponse = {
  addStampByUserId: StampAdded[];
};
