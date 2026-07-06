import { useQueryWithErrorHandling } from "@/hooks/graphql/useQueryWithErrorHandling";
import {
  MERCHANT_STATS_TREND_STREAK_VISITS_QUERY,
  type MerchantStatsTrendStreakVisitsQueryResult,
  type MerchantStatsTrendWindowVariables,
} from "@/shared/api-client/src/graphql/queries/merchantStats";
import type { StatsCompareMode } from "@/shared/api-client/src/stats/types";
import type { TrendGranularity } from "@/shared/api-client/src/stats/types";
import type { UseQueryOptions } from "./types";

type UseMerchantStatsTrendStreakVisitsOptions = UseQueryOptions & {
  from: string;
  to: string;
  granularity: TrendGranularity;
  merchantId?: string;
  storeId?: string;
  storeIds?: string[];
  loyaltyCardTemplateId?: string;
  streakProgramId?: string;
  compareMode: StatsCompareMode;
  operationName?: string;
};

export const useMerchantStatsTrendStreakVisits = (options: UseMerchantStatsTrendStreakVisitsOptions) => {
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
    granularity,
    operationName = "MerchantStatsTrendStreakVisits",
  } = options;

  const variables: MerchantStatsTrendWindowVariables = {
    from,
    to,
    granularity,
    compareMode,
    ...(merchantId ? { merchantId } : {}),
    ...(storeId ? { storeId } : {}),
    ...(storeIds && storeIds.length > 0 ? { storeIds } : {}),
    ...(loyaltyCardTemplateId ? { loyaltyCardTemplateId } : {}),
    ...(streakProgramId ? { streakProgramId } : {}),
  };

  return useQueryWithErrorHandling<
    MerchantStatsTrendStreakVisitsQueryResult,
    MerchantStatsTrendWindowVariables
  >(MERCHANT_STATS_TREND_STREAK_VISITS_QUERY, {
    skip,
    variables,
    fetchPolicy: "network-only",
    operationName,
  });
};
