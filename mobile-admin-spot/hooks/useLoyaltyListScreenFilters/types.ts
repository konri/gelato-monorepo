import type { Coupon } from "@/shared/api-client/src/graphql/mutations/coupon";
import type { Reward } from "@/shared/api-client/src/graphql/queries/myRewards";
import type {
  LoyaltyListAppliedFilters,
  LoyaltyListFilterScreenKind,
} from "@/utils/loyaltyListFilterApply";

export type UseLoyaltyListScreenFiltersParams = {
  appliedFilters: LoyaltyListAppliedFilters;
  selectedStoreId: string | null;
  kind: LoyaltyListFilterScreenKind;
  globalCouponById?: Map<string, Coupon>;
  globalRewardById?: Map<string, Reward>;
  globalStoreScopeBaselineReady?: boolean;
};
