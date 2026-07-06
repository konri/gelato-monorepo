import { getMappedApolloErrorMessage } from "@/utils/apolloError";

const COUPON_UPDATE_ERROR_MESSAGES: Record<string, string> = {
  COUPON_UPDATE_NOT_FOUND: "Coupon.updateErrorNotFound",
  COUPON_UPDATE_NO_ACCESS: "Coupon.updateErrorNoAccess",
  COUPON_UPDATE_COUPON_TYPE_LOCKED: "Coupon.updateErrorLockedAfterClaim",
  COUPON_UPDATE_AVAILABILITY_LOCKED: "Coupon.updateErrorLockedAfterClaim",
  COUPON_UPDATE_POINTS_COST_LOCKED: "Coupon.updateErrorLockedAfterClaim",
  COUPON_UPDATE_REWARD_LOCKED: "Coupon.updateErrorLockedAfterClaim",
  COUPON_UPDATE_EXCLUSIVITY_GROUPS_LOCKED: "Coupon.updateErrorLockedAfterClaim",
  COUPON_UPDATE_INVALID_DATE_RANGE: "Coupon.validUntilAfterStart",
  COUPON_UPDATE_POINTS_COST_NEGATIVE: "Coupon.updateErrorInvalidNumericValue",
  COUPON_UPDATE_PRIORITY_NEGATIVE: "Coupon.updateErrorInvalidNumericValue",
  COUPON_UPDATE_MAX_USES_PER_USER_NEGATIVE: "Coupon.updateErrorInvalidNumericValue",
  COUPON_UPDATE_TOTAL_QUANTITY_NEGATIVE: "Coupon.updateErrorInvalidNumericValue",
  COUPON_UPDATE_BUY_QUANTITY_NEGATIVE: "Coupon.updateErrorInvalidNumericValue",
  COUPON_UPDATE_GET_QUANTITY_NEGATIVE: "Coupon.updateErrorInvalidNumericValue",
  COUPON_UPDATE_DISCOUNT_VALUE_NEGATIVE: "Coupon.updateErrorInvalidNumericValue",
  COUPON_UPDATE_THRESHOLD_AMOUNT_NEGATIVE: "Coupon.updateErrorInvalidNumericValue",
  COUPON_UPDATE_DISCOUNT_AMOUNT_NEGATIVE: "Coupon.updateErrorInvalidNumericValue",
  COUPON_UPDATE_DAYS_BEFORE_BIRTHDAY_NEGATIVE: "Coupon.updateErrorInvalidNumericValue",
  COUPON_UPDATE_DAYS_AFTER_BIRTHDAY_NEGATIVE: "Coupon.updateErrorInvalidNumericValue",
  COUPON_UPDATE_USES_PER_USER_LIMIT_NEGATIVE: "Coupon.updateErrorInvalidNumericValue",
  COUPON_UPDATE_GLOBAL_USAGE_LIMIT_BELOW_CURRENT_USES:
    "Coupon.updateErrorGlobalUsageLimitBelowCurrentUses",
  COUPON_UPDATE_GLOBAL_USAGE_LIMIT_NEGATIVE: "Coupon.updateErrorInvalidNumericValue",
  COUPON_UPDATE_USES_PER_USER_LIMIT_DECREASE_LOCKED:
    "Coupon.updateErrorLimitLockedAfterUsage",
  COUPON_UPDATE_USES_PER_USER_LIMIT_SET_LOCKED: "Coupon.updateErrorLimitLockedAfterUsage",
  COUPON_UPDATE_GLOBAL_USAGE_LIMIT_DECREASE_LOCKED:
    "Coupon.updateErrorLimitLockedAfterUsage",
  COUPON_UPDATE_GLOBAL_USAGE_LIMIT_SET_LOCKED: "Coupon.updateErrorLimitLockedAfterUsage",
  COUPON_UPDATE_POINTS_AVAILABILITY_REQUIRES_POINTS_COST:
    "Coupon.updateErrorPointsAvailabilityRequiresPointsCost",
  COUPON_UPDATE_FREE_AVAILABILITY_REQUIRES_NULL_POINTS_COST:
    "Coupon.updateErrorFreeAvailabilityRequiresNullPointsCost",
  COUPON_UPDATE_REWARD_NOT_FOUND: "Coupon.updateErrorRewardNotFound",
  COUPON_UPDATE_REWARD_DIFFERENT_MERCHANT: "Coupon.updateErrorRewardDifferentMerchant",
};

export const getCouponMutationErrorMessage = (
  error: unknown,
  t: (key: string) => string,
  isEditMode: boolean,
): string => {
  return getMappedApolloErrorMessage(
    error,
    t,
    COUPON_UPDATE_ERROR_MESSAGES,
    isEditMode ? "Coupon.updateErrorGeneric" : "Common.saveDataFailed",
  );
};
