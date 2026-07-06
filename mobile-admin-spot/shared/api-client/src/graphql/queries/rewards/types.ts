export type AvailableRewardType = "MILESTONE" | "MAIN";

export type MerchantName = {
  name: string;
};

export type TemplateBasicFields = {
  title: string;
  rewardTitle?: string | null;
  awardType?: string | null;
  minimumAmount?: number | null;
  resetStampsOnMilestoneClaim?: boolean | null;
};

export type MilestoneBasic = {
  title: string;
  description?: string;
  milestoneType: string;
  discountPercent?: number;
  discountAmount?: number;
  pointsReward?: number;
};

export type MilestoneFull = MilestoneBasic & {
  id: string;
  stampsRequired?: number;
};

export type AvailableMilestoneReward = MilestoneFull;

export type AvailableReward = {
  type: AvailableRewardType;
  milestone?: AvailableMilestoneReward | null;
  mainRewardTitle?: string | null;
  mainRewardDescription?: string | null;
  mainRewardType?: string | null;
  mainRewardDiscountPercent?: number | null;
  mainRewardDiscountAmount?: number | null;
};

export type StampCardBasicInfo = {
  id: string;
  stampsCollected: number;
  stampsRequired: number;
  merchant: MerchantName;
  template: TemplateBasicFields;
};

export type MyStampCardWithRewards = StampCardBasicInfo & {
  isActive: boolean;
  availableRewards: AvailableReward[];
};

export type MyStampCardsWithAvailableRewardsResponse = {
  myStampCards: MyStampCardWithRewards[];
};

export type CardClaimedMilestone = {
  id: string;
  cardId: string;
  milestoneId?: string | null;
  isAvailable: boolean;
  isClaimed: boolean;
  isRedeemed: boolean;
  isReadyToRedeem: boolean;
  redeemedAt?: string | null;
  claimedAt: string;
  milestone?: MilestoneFull | null;
};

export type ClaimedReward = {
  id: string;
  cardId: string;
  milestoneId?: string | null;
  isAvailable: boolean;
  isClaimed: boolean;
  isRedeemed: boolean;
  isReadyToRedeem: boolean;
  redeemedAt?: string | null;
  claimedAt: string;
  milestone?: MilestoneFull | null;
  card: StampCardBasicInfo;
};

export type UserRewardSource =
  | "STAMP_MAIN"
  | "STAMP_MILESTONE"
  | "STREAK"
  | "COUPON"
  | "POINT_VOUCHER"
  | "MERCHANT_VOUCHER";

export type UserClaimedRewardStatus = {
  id: string;
  source: UserRewardSource;
  rewardId?: string | null;
  streakProgramId?: string | null;
  streakStageId?: string | null;
  cardId?: string | null;
  milestoneId?: string | null;
  title: string;
  description?: string | null;
  merchantId?: string | null;
  merchantName?: string | null;
  claimedAt: string;
  isRedeemed?: boolean | null;
  redeemedAt?: string | null;
};

export type GetUserClaimedRewardsResponse = {
  getUserClaimedRewards: UserClaimedRewardStatus[];
};

export type UserAvailableRewardStatus = {
  id: string;
  source: UserRewardSource;
  rewardId?: string | null;
  cardId?: string | null;
  milestoneId?: string | null;
  streakProgramId?: string | null;
  streakStageId?: string | null;
  title: string;
  description?: string | null;
  merchantId?: string | null;
  merchantName?: string | null;
  stampsCollected?: number | null;
  stampsRequired?: number | null;
  currentStreak?: number | null;
  dayThreshold?: number | null;
  canClaim: boolean;
};

export type GetAvailableRewardsResponse = {
  getAvailableRewards: UserAvailableRewardStatus[];
};

export type TemplateMilestone = {
  id: string;
  title: string;
  description?: string;
  milestoneType: string;
  stampsRequired?: number;
  discountPercent?: number;
  discountAmount?: number;
  pointsReward?: number;
};

export type UserStampCard = StampCardBasicInfo & {
  isActive: boolean;
  createdAt: string;
  template: TemplateBasicFields & {
    milestones?: TemplateMilestone[] | null;
  };
  availableRewards: AvailableReward[];
  claimedMilestones: CardClaimedMilestone[];
};

export type GetUserStampCardsResponse = {
  getUserStampCards: UserStampCard[];
};
