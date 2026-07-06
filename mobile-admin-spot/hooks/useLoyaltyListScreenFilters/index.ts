import {
  countActiveLoyaltyFilters,
  mergeAppliedWithLock,
} from "@/utils/loyaltyListFilterApply";
import { useMemo } from "react";
import type { UseLoyaltyListScreenFiltersParams } from "./types";

export function useLoyaltyListScreenFilters({
  appliedFilters,
  selectedStoreId,
  kind,
  globalCouponById,
  globalRewardById,
  globalStoreScopeBaselineReady,
}: UseLoyaltyListScreenFiltersParams) {
  const filterRuntime = useMemo(
    () => ({
      ...mergeAppliedWithLock(
        appliedFilters,
        selectedStoreId,
        globalStoreScopeBaselineReady ?? true,
      ),
      globalCouponById,
      globalRewardById,
    }),
    [
      appliedFilters,
      selectedStoreId,
      globalCouponById,
      globalRewardById,
      globalStoreScopeBaselineReady,
    ],
  );

  const activeFilterCount = useMemo(
    () => countActiveLoyaltyFilters(appliedFilters, kind),
    [appliedFilters, kind],
  );

  const hideStoreFilterSection = Boolean(selectedStoreId);

  return { filterRuntime, activeFilterCount, hideStoreFilterSection };
}
