import { useQueryWithErrorHandling } from "@/hooks/graphql/useQueryWithErrorHandling";
import {
  MERCHANT_STATS_BUNDLE_QUERY,
  type MerchantStatsBundleQueryResult,
  type MerchantStatsBundleQueryVariables,
} from "@/shared/api-client/src/graphql/queries/merchantStats";
import type { StatsCompareMode } from "@/shared/api-client/src/stats/types";
import type { UseQueryOptions } from "./types";

type UseMerchantStatsBundleOptions = UseQueryOptions & {
  from: string;
  to: string;
  merchantId?: string;
  storeId?: string;
  storeIds?: string[];
  loyaltyCardTemplateId?: string;
  streakProgramId?: string;
  compareMode: StatsCompareMode;
  operationName?: string;
};

export const useMerchantStatsBundle = (options: UseMerchantStatsBundleOptions) => {
  const {
    skip,
    from,
    to,
    merchantId,
    storeId,
    storeIds,
    loyaltyCardTemplateId,
    streakProgramId,
    compareMode,
    operationName = "MerchantStatsBundle",
  } = options;

  const variables: MerchantStatsBundleQueryVariables = {
    from,
    to,
    compareMode,
    ...(merchantId ? { merchantId } : {}),
    ...(storeId ? { storeId } : {}),
    ...(storeIds && storeIds.length > 0 ? { storeIds } : {}),
    ...(loyaltyCardTemplateId ? { loyaltyCardTemplateId } : {}),
    ...(streakProgramId ? { streakProgramId } : {}),
  };

  return useQueryWithErrorHandling<MerchantStatsBundleQueryResult, MerchantStatsBundleQueryVariables>(
    MERCHANT_STATS_BUNDLE_QUERY,
    {
      skip,
      variables,
      fetchPolicy: "network-only",
      operationName,
    },
  );
};
