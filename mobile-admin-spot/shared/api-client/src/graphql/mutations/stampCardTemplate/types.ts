export type RewardType =
  | "DISCOUNT_PERCENT"
  | "DISCOUNT_AMOUNT"
  | "FREE_SERVICE";

export type MilestoneType =
  | "DISCOUNT_PERCENT"
  | "DISCOUNT_AMOUNT"
  | "POINTS_REWARD"
  | "FREE_SERVICE";

export type CreateStampMilestoneInput = {
  stampsRequired: number;
  rewardId?: string;
  milestoneType: MilestoneType;
  discountPercent?: number;
  discountAmount?: number;
  pointsReward?: number;
  imageUrl?: string;
  title: string;
  description?: string;
};

export type CreateStampCardTemplateInput = {
  merchantId: string;
  title: string;
  description?: string;
  stampsRequired: number;
  awardType?: string;
  minimumAmount?: number;
  rewardId?: string;
  rewardType?: RewardType;
  rewardTitle?: string;
  rewardDescription?: string;
  rewardDiscountPercent?: number;
  rewardDiscountAmount?: number;
  rewardImageUrl?: string;
  resetStampsOnMilestoneClaim?: boolean;
  validFrom?: string;
  validUntil?: string;
  isActive?: boolean;
  stampStickerIconUrl?: string;
  milestones?: CreateStampMilestoneInput[];
};

export type StampCardTemplateBasic = {
  id: string;
  merchantId: string;
  title: string;
  description?: string;
  stampCoverUrl?: string;
  stampStickerIconUrl?: string;
  stampsRequired: number;
  awardType?: string;
  minimumAmount?: number;
  rewardTitle?: string;
  rewardDescription?: string;
  rewardType: RewardType;
  rewardDiscountPercent?: number;
  rewardDiscountAmount?: number;
  rewardImageUrl?: string;
  resetStampsOnMilestoneClaim: boolean;
  isActive: boolean;
  validFrom?: string;
  validUntil?: string;
  stampCards: unknown[];
  milestones?: {
    id: string;
    templateId: string;
    stampsRequired: number;
    milestoneType: MilestoneType;
    discountPercent?: number;
    discountAmount?: number;
    pointsReward?: number;
    imageUrl?: string;
    title: string;
    description?: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
  }[];
  createdAt: string;
  updatedAt: string;
};

export type CreateStampCardTemplateResponse = {
  createStampCardTemplate: StampCardTemplateBasic;
};

export type UpdateStampCardTemplateResponse = {
  updateStampCardTemplate: StampCardTemplateBasic;
};
