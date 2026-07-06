import type { TypePolicies } from "@apollo/client";

import { loyaltyListingEntityTypePolicies } from "./loyaltyListingEntityTypePolicies";

const queryRootTypePolicies = {
  Query: {
    fields: {
      stores: {
        merge: true,
      },
      vouchers: {
        merge: true,
      },
      merchantStatsBundle: {
        keyArgs: [
          "from",
          "to",
          "merchantId",
          "storeId",
          "storeIds",
          "loyaltyCardTemplateId",
          "streakProgramId",
          "compareMode",
        ],
      },
      merchantStatsTrendOrders: {
        keyArgs: [
          "from",
          "to",
          "merchantId",
          "storeId",
          "storeIds",
          "loyaltyCardTemplateId",
          "streakProgramId",
          "compareMode",
          "granularity",
        ],
      },
      merchantStatsTrendStreakVisits: {
        keyArgs: [
          "from",
          "to",
          "merchantId",
          "storeId",
          "storeIds",
          "loyaltyCardTemplateId",
          "streakProgramId",
          "compareMode",
          "granularity",
        ],
      },
    },
  },
} as const satisfies TypePolicies;

export const inMemoryTypePolicies = {
  ...loyaltyListingEntityTypePolicies,
  ...queryRootTypePolicies,
} as const satisfies TypePolicies;
