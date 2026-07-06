import type { CouponType } from "@/shared/api-client/src/graphql/mutations/coupon";
import type { RewardValueType } from "@/shared/api-client/src/graphql/queries/myRewards";
import type { StreakingPolicy } from "@/shared/api-client/src/graphql/queries/streaks";
import { COUPON_TYPES } from "@/utils/couponForm";
import {
  REWARD_FILTER_VALUE_TYPES,
  STREAK_FILTER_POLICIES,
} from "@/utils/loyaltyListFilterApply";
import { getRewardValueTypeOptions } from "@/utils/rewardForm";
import type { TFunction } from "i18next";

export type LoyaltyFilterPillOption<T extends string> = { id: T; label: string };

export const getLoyaltyCouponTypeFilterOptions = (
  t: TFunction,
): LoyaltyFilterPillOption<CouponType>[] =>
  COUPON_TYPES.map((id) => ({ id, label: t(`Coupon.type${id}`) }));

export const getLoyaltyRewardValueTypeFilterOptions = (
  t: TFunction,
): LoyaltyFilterPillOption<RewardValueType>[] => {
  const labelByValue = new Map<string, string>();
  for (const option of getRewardValueTypeOptions(t)) {
    labelByValue.set(option.value, option.label);
  }
  labelByValue.set("PRODUCT", t("LoyaltyListFilter.rewardValueTypePRODUCT"));
  labelByValue.set(
    "CASH_VOUCHER",
    t("LoyaltyListFilter.rewardValueTypeCASH_VOUCHER"),
  );
  return REWARD_FILTER_VALUE_TYPES.map((id) => ({
    id,
    label: labelByValue.get(id) ?? id,
  }));
};

export const getLoyaltyStreakPolicyFilterOptions = (
  t: TFunction,
): LoyaltyFilterPillOption<StreakingPolicy>[] =>
  STREAK_FILTER_POLICIES.map((id) => ({
    id,
    label: t(`Streak.streakingPolicy${id}`),
  }));
