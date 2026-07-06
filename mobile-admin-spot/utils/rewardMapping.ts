import type {
  MilestoneType,
  RewardType,
} from "@/shared/api-client/src/graphql/mutations/stampCardTemplate";
import type { StampCardFormData } from "@/components/organisms/StampCardPreview/types";
import type { RewardValueType } from "@/shared/api-client/src/graphql/queries/myRewards";
import type { UseFormReturn } from "react-hook-form";

export type RewardInput = {
  id?: string;
  title: string;
  description?: string | null;
  valueType: RewardValueType;
  discountPercent?: number | string | null;
  discountAmount?: number | string | null;
  imageUrl?: string | null;
};

export const mapToRewardType = (
  valueType: RewardValueType,
): RewardType | undefined => {
  if (
    valueType === "DISCOUNT_PERCENT" ||
    valueType === "DISCOUNT_AMOUNT" ||
    valueType === "FREE_SERVICE"
  ) {
    return valueType as RewardType;
  }
  return undefined;
};

export const mapToMilestoneType = (
  valueType: RewardValueType,
): MilestoneType => {
  if (valueType === "POINTS") return "POINTS_REWARD";
  if (
    valueType === "DISCOUNT_PERCENT" ||
    valueType === "DISCOUNT_AMOUNT" ||
    valueType === "FREE_SERVICE"
  ) {
    return valueType as MilestoneType;
  }
  return "FREE_SERVICE";
};

const toOptionalNumber = (
  value: number | string | null | undefined,
): number | undefined => {
  if (value == null || value === "") return undefined;
  return Number(value);
};

export const applyRewardToStampCardForm = (
  form: UseFormReturn<StampCardFormData>,
  reward: RewardInput,
  isForMilestone: boolean,
) => {
  const discountPercent =
    reward.valueType === "DISCOUNT_PERCENT"
      ? toOptionalNumber(reward.discountPercent)
      : undefined;
  const discountAmount =
    reward.valueType === "DISCOUNT_AMOUNT"
      ? toOptionalNumber(reward.discountAmount)
      : undefined;

  if (isForMilestone) {
    const currentMilestones = form.getValues("milestones") ?? [];
    const currentMilestone = currentMilestones[0] ?? { stampsRequired: 1 };

    form.setValue("milestones", [
      {
        ...currentMilestone,
        rewardId: reward.id,
        milestoneType: mapToMilestoneType(reward.valueType),
        title: reward.title,
        description: reward.description ?? undefined,
        discountPercent,
        discountAmount,
        imageUrl: reward.imageUrl ?? undefined,
      },
    ]);
  } else {
    form.setValue("rewardId", reward.id);
    form.setValue("rewardType", mapToRewardType(reward.valueType));
    form.setValue("rewardTitle", reward.title);
    form.setValue("rewardDescription", reward.description ?? "");
    form.setValue("rewardDiscountPercent", discountPercent);
    form.setValue("rewardDiscountAmount", discountAmount);
    form.setValue("rewardImageUrl", reward.imageUrl ?? undefined);
  }
};
