import type { TypePolicies } from "@apollo/client";

export const loyaltyListingEntityTypePolicies = {
  Coupon: {
    keyFields: false,
  },
  Reward: {
    keyFields: false,
  },
  StreakProgram: {
    keyFields: false,
  },
} as const satisfies TypePolicies;
