import type { StampCardFormData } from "@/components/organisms/StampCardPreview/types";
import {
  CREATE_STAMP_CARD_TEMPLATE_MUTATION,
  CreateStampCardTemplateInput,
  CreateStampCardTemplateResponse,
  type CreateStampMilestoneInput,
  type RewardType,
} from "@/shared/api-client/src/graphql/mutations/stampCardTemplate";
import { GET_MY_STAMP_CARD_TEMPLATES_QUERY } from "@/shared/api-client/src/graphql/queries/stampCardTemplates";
import { getAmountPerStampThreshold } from "@/utils/stampTemplateAward";
import { useMutationWithErrorHandling } from "../useMutationWithErrorHandling";

type CreateStampCardTemplateVariables = {
  data: CreateStampCardTemplateInput;
};

export const buildCreateStampCardTemplateInput = (
  merchantId: string,
  formData: StampCardFormData,
): CreateStampCardTemplateInput => {
  const filteredMilestones: CreateStampMilestoneInput[] = (
    formData.milestones || []
  )
    .filter((milestone) => milestone.title && milestone.milestoneType)
    .map((milestone) => ({
      stampsRequired: Number(milestone.stampsRequired),
      rewardId: milestone.rewardId || undefined,
      milestoneType: milestone.milestoneType,
      discountPercent:
        milestone.discountPercent !== undefined &&
        milestone.discountPercent !== null
          ? Number(milestone.discountPercent)
          : undefined,
      discountAmount:
        milestone.discountAmount !== undefined &&
        milestone.discountAmount !== null
          ? Number(milestone.discountAmount)
          : undefined,
      pointsReward:
        milestone.pointsReward !== undefined && milestone.pointsReward !== null
          ? Number(milestone.pointsReward)
          : undefined,
      imageUrl: milestone.imageUrl,
      title: milestone.title || "",
      description: milestone.description || undefined,
    }));

  const rewardType = formData.rewardType;

  const rewardDiscountPercent =
    rewardType === "DISCOUNT_PERCENT" && formData.rewardDiscountPercent != null
      ? Number(formData.rewardDiscountPercent)
      : undefined;
  const rewardDiscountAmount =
    rewardType === "DISCOUNT_AMOUNT" && formData.rewardDiscountAmount != null
      ? Number(formData.rewardDiscountAmount)
      : undefined;

  const awardType = formData.awardType;
  const minimumAmount =
    awardType === "amount"
      ? getAmountPerStampThreshold(formData.minimumAmount ?? "")
      : undefined;

  return {
    merchantId,
    title: formData.title || "",
    description: formData.cardMessage || undefined,
    stampsRequired: formData.stampsRequired || 0,
    awardType,
    minimumAmount,
    rewardId: formData.rewardId || undefined,
    rewardType: rewardType as RewardType | undefined,
    rewardTitle: formData.rewardTitle || undefined,
    rewardDescription: formData.rewardDescription || undefined,
    rewardDiscountPercent,
    rewardDiscountAmount,
    resetStampsOnMilestoneClaim: formData.intermediateRewardRemovesStamps,
    validFrom: formData.validFrom,
    validUntil: formData.validUntil,
    isActive: formData.isActive ?? true,
    rewardImageUrl: formData.rewardImageUrl,
    stampStickerIconUrl: formData.stampStyle || undefined,
    milestones: filteredMilestones.length > 0 ? filteredMilestones : undefined,
  };
};

export const useCreateStampCardTemplate = () => {
  return useMutationWithErrorHandling<
    CreateStampCardTemplateResponse,
    CreateStampCardTemplateVariables
  >(CREATE_STAMP_CARD_TEMPLATE_MUTATION, {
    operationName: "CreateStampCardTemplate",
    refetchQueries: [{ query: GET_MY_STAMP_CARD_TEMPLATES_QUERY }],
  });
};
