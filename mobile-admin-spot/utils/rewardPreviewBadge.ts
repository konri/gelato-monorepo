import type { RewardValueType } from "@/shared/api-client/src/graphql/queries/myRewards";
import type { TFunction } from "i18next";

export type RewardPreviewBadgeInput = {
  valueType: RewardValueType;
  discountPercent?: string;
  discountAmount?: string;
  pointsValue?: string;
};

export function getRewardPreviewBadgeLabel(
  input: RewardPreviewBadgeInput,
  t: TFunction,
): string | null {
  const { valueType, discountPercent, discountAmount, pointsValue } = input;
  switch (valueType) {
    case "DISCOUNT_PERCENT": {
      const v = discountPercent?.trim();
      return v
        ? t("Loyalty.rewardPreviewBadgeDiscountPercent", { value: v })
        : t("Loyalty.rewardPreviewBadgeDiscountEmpty");
    }
    case "DISCOUNT_AMOUNT": {
      const v = discountAmount?.trim();
      return v
        ? t("Loyalty.rewardPreviewBadgeDiscountAmount", { value: v })
        : t("Loyalty.rewardPreviewBadgeDiscountEmpty");
    }
    case "POINTS": {
      const v = pointsValue?.trim();
      if (!v) {
        return t("Loyalty.milestoneTypePointsReward");
      }
      const normalized = v.replace(",", ".");
      const n = Math.round(Number.parseFloat(normalized));
      const count = Number.isFinite(n) && n >= 0 ? n : 0;
      return t("Loyalty.rewardPreviewBadgePointsCount", { count });
    }
    case "FREE_SERVICE":
      return t("Loyalty.rewardPreviewBadgeFreeService");
    default:
      return null;
  }
}
