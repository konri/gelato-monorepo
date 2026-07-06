import { getMappedApolloErrorMessage } from "@/utils/apolloError";

const MERCHANT_STATS_QUERY_ERROR_MESSAGES: Record<string, string> = {};

export const getMerchantStatsQueryErrorMessage = (
  error: unknown,
  t: (key: string) => string,
): string => {
  return getMappedApolloErrorMessage(
    error,
    t,
    MERCHANT_STATS_QUERY_ERROR_MESSAGES,
    "MerchantStats.loadError",
  );
};
