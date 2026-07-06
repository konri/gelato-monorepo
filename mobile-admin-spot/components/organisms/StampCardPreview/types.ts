import {
  CreateStampMilestoneInput,
  RewardType,
} from "@/shared/api-client/src/graphql/mutations/stampCardTemplate";

export type StampCardFormData = {
  title: string;
  awardType: "visit" | "amount";
  minimumAmount: string;
  stampsRequired?: number;
  stampStyle?: string;
  cardMessage: string;
  validFrom?: string;
  validUntil?: string;
  isActive?: boolean;
  milestones?: CreateStampMilestoneInput[];
  intermediateRewardRemovesStamps?: boolean;
  intermediateRewardMessage?: string;
  rewardId?: string;
  rewardType?: RewardType;
  rewardTitle?: string;
  rewardDescription?: string;
  rewardDiscountPercent?: number;
  rewardDiscountAmount?: number;
  rewardAdditionalFee?: number;
  rewardImageUrl?: string;
};
