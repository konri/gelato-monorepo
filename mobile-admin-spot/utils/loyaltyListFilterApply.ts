import type { Coupon, CouponType } from "@/shared/api-client/src/graphql/mutations/coupon";
import type { Reward, RewardValueType } from "@/shared/api-client/src/graphql/queries/myRewards";
import type { StreakingPolicy, StreakProgram } from "@/shared/api-client/src/graphql/queries/streaks";
import {
  isCouponExclusiveToStore,
  isRewardExclusiveToStore,
} from "@/utils/loyaltyListingScope";

export const REWARD_FILTER_VALUE_TYPES: RewardValueType[] = [
  "FREE_SERVICE",
  "DISCOUNT_PERCENT",
  "DISCOUNT_AMOUNT",
  "PRODUCT",
  "POINTS",
  "CASH_VOUCHER",
];

export const STREAK_FILTER_POLICIES: StreakingPolicy[] = ["DAILY", "WEEKLY", "MONTHLY"];

export type LoyaltyListAppliedFilters = {
  storeIds: string[];
  couponTypes: CouponType[];
  rewardValueTypes: RewardValueType[];
  streakingPolicies: StreakingPolicy[];
  storeExclusiveOnly: boolean;
};

export type LoyaltyListFilterListKey = keyof Pick<
  LoyaltyListAppliedFilters,
  "storeIds" | "couponTypes" | "rewardValueTypes" | "streakingPolicies"
>;

export type LoyaltyListFilterRuntime = LoyaltyListAppliedFilters & {
  lockedStoreId: string | null;
  globalCouponById?: Map<string, Coupon>;
  globalRewardById?: Map<string, Reward>;
  globalStoreScopeBaselineReady: boolean;
};

export const createEmptyLoyaltyListFilters = (): LoyaltyListAppliedFilters => ({
  storeIds: [],
  couponTypes: [],
  rewardValueTypes: [],
  streakingPolicies: [],
  storeExclusiveOnly: false,
});

export const togglePrimitiveList = <T extends string>(list: T[], item: T): T[] =>
  list.includes(item) ? list.filter((x) => x !== item) : [...list, item];

export type LoyaltyListFilterToggleArgs =
  | ["storeIds", string]
  | ["couponTypes", CouponType]
  | ["rewardValueTypes", RewardValueType]
  | ["streakingPolicies", StreakingPolicy];

export const patchLoyaltyListToggleListItem = (
  previous: LoyaltyListAppliedFilters,
  ...args: LoyaltyListFilterToggleArgs
): LoyaltyListAppliedFilters => {
  const [key, item] = args;
  switch (key) {
    case "storeIds":
      return {
        ...previous,
        storeIds: togglePrimitiveList(previous.storeIds, item),
      };
    case "couponTypes":
      return {
        ...previous,
        couponTypes: togglePrimitiveList(previous.couponTypes, item),
      };
    case "rewardValueTypes":
      return {
        ...previous,
        rewardValueTypes: togglePrimitiveList(previous.rewardValueTypes, item),
      };
    case "streakingPolicies":
      return {
        ...previous,
        streakingPolicies: togglePrimitiveList(previous.streakingPolicies, item),
      };
  }
};

export const mergeAppliedWithLock = (
  applied: LoyaltyListAppliedFilters,
  lockedStoreId: string | null,
  globalStoreScopeBaselineReady = true,
): LoyaltyListFilterRuntime => ({
  ...applied,
  lockedStoreId,
  globalStoreScopeBaselineReady,
});

export const matchesStoreScope = (
  availableStoreIds: string[] | null | undefined,
  runtime: Pick<LoyaltyListFilterRuntime, "lockedStoreId" | "storeIds">,
): boolean => {
  if (runtime.lockedStoreId) {
    const ids = availableStoreIds;
    return (ids?.length ?? 0) === 0 || (ids?.includes(runtime.lockedStoreId) ?? false);
  }
  if (runtime.storeIds.length === 0) {
    return true;
  }
  const ids = availableStoreIds ?? [];
  if (ids.length === 0) {
    return true;
  }
  return runtime.storeIds.some((id) => ids.includes(id));
};

export const filterCouponsByLoyaltyFilters = (
  coupons: Coupon[],
  runtime: LoyaltyListFilterRuntime,
): Coupon[] =>
  coupons.filter((coupon) => {
    if (!matchesStoreScope(coupon.availableStoreIds, runtime)) {
      return false;
    }
    if (runtime.couponTypes.length > 0 && !runtime.couponTypes.includes(coupon.couponType)) {
      return false;
    }
    if (
      runtime.storeExclusiveOnly &&
      runtime.lockedStoreId &&
      runtime.globalCouponById &&
      runtime.globalStoreScopeBaselineReady &&
      !isCouponExclusiveToStore(coupon, runtime.lockedStoreId, runtime.globalCouponById)
    ) {
      return false;
    }
    return true;
  });

export const filterRewardsByLoyaltyFilters = (
  rewards: Reward[],
  runtime: Pick<
    LoyaltyListFilterRuntime,
    | "lockedStoreId"
    | "storeIds"
    | "rewardValueTypes"
    | "storeExclusiveOnly"
    | "globalRewardById"
    | "globalStoreScopeBaselineReady"
  >,
): Reward[] =>
  rewards.filter((reward) => {
    if (!matchesStoreScope(reward.availableStoreIds, runtime)) {
      return false;
    }
    if (
      runtime.rewardValueTypes.length > 0 &&
      !runtime.rewardValueTypes.includes(reward.valueType)
    ) {
      return false;
    }
    if (
      runtime.storeExclusiveOnly &&
      runtime.lockedStoreId &&
      runtime.globalRewardById &&
      runtime.globalStoreScopeBaselineReady &&
      !isRewardExclusiveToStore(reward, runtime.lockedStoreId, runtime.globalRewardById)
    ) {
      return false;
    }
    return true;
  });

export const filterStreakProgramsByLoyaltyFilters = (
  programs: StreakProgram[],
  runtime: Pick<
    LoyaltyListFilterRuntime,
    "lockedStoreId" | "storeIds" | "streakingPolicies"
  >,
): StreakProgram[] =>
  programs.filter((program) => {
    if (!matchesStoreScope(program.availableStoreIds, runtime)) {
      return false;
    }
    if (
      runtime.streakingPolicies.length > 0 &&
      !runtime.streakingPolicies.includes(program.streakingPolicy)
    ) {
      return false;
    }
    return true;
  });

export type LoyaltyListFilterScreenKind = "coupons" | "rewards" | "streaks";

export const countActiveLoyaltyFilters = (
  applied: LoyaltyListAppliedFilters,
  listKind: LoyaltyListFilterScreenKind,
): number => {
  let count = 0;
  if (applied.storeIds.length > 0) {
    count++;
  }
  if (listKind === "coupons" && applied.couponTypes.length > 0) {
    count++;
  }
  if (listKind === "rewards" && applied.rewardValueTypes.length > 0) {
    count++;
  }
  if (listKind === "streaks" && applied.streakingPolicies.length > 0) {
    count++;
  }
  if (applied.storeExclusiveOnly) {
    count++;
  }
  return count;
};
