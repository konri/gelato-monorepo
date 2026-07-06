import type {
  CreateStampMilestoneInput,
  RewardType,
} from "../../mutations/stampCardTemplate";

export type StampCardTemplateMinimal = {
  id: string;
  isActive: boolean;
  merchantId: string;
  validFrom?: string | null;
  validUntil?: string | null;
};

export type StampCardTemplateDetails = {
  id: string;
  title?: string;
  description?: string;
  stampsRequired?: number;
  isActive?: boolean;
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
  stampStickerIconUrl?: string;
  awardType?: string | null;
  minimumAmount?: number | null;
  milestones?: (CreateStampMilestoneInput & { id: string })[];
  stampCards?: { id: string; stampsCollected: number }[];
};

export type GetMyStampCardTemplatesResponse = {
  myStampCardTemplates: StampCardTemplateMinimal[];
};

export type GetMyStampCardTemplatesDetailsResponse = {
  myStampCardTemplates: StampCardTemplateDetails[];
};
