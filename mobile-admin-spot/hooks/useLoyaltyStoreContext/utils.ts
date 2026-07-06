import { router } from "expo-router";
import type { LoyaltyListEntity, NavigateToFormParams } from "./types";

const loyaltyFormPathname = {
  coupons: "/company/coupons/form",
  rewards: "/company/rewards/form",
  streaks: "/company/streaks/form",
} as const satisfies Record<LoyaltyListEntity, string>;

const entityIdParams = {
  coupons: (entityId: string) => ({ couponId: entityId }),
  rewards: (entityId: string) => ({ rewardId: entityId }),
  streaks: (entityId: string) => ({ streakProgramId: entityId }),
} as const;

export const navigateToLoyaltyForm = (
  loyaltyEntity: LoyaltyListEntity,
  params: NavigateToFormParams,
) => {
  const { entityId, scope, overrideStoreId } = params;
  const pathname = loyaltyFormPathname[loyaltyEntity];

  router.push({
    pathname,
    params: {
      ...(entityId ? entityIdParams[loyaltyEntity](entityId) : {}),
      ...(scope && { loyaltyEditScope: scope }),
      ...(overrideStoreId && { overrideStoreId }),
    },
  });
};
