import type { MerchantStatsBundleData } from "@/shared/api-client/src/graphql/queries/merchantStats";

import { collectClientsInsightCandidates } from "./clients";
import { collectCouponsInsightCandidates } from "./coupons";
import { pickTopInsights } from "./pickTopInsights";
import { collectPointsRewardsInsightCandidates } from "./pointsRewards";
import { collectStreaksInsightCandidates } from "./streaks";
import type { MerchantStatsInsightItem } from "./types";

export const buildHubStatsInsights = (bundle: MerchantStatsBundleData): MerchantStatsInsightItem[] => {
  const merged: MerchantStatsInsightItem[] = [
    ...collectClientsInsightCandidates(bundle),
    ...collectCouponsInsightCandidates(bundle),
    ...collectPointsRewardsInsightCandidates(bundle),
    ...collectStreaksInsightCandidates(bundle),
  ];
  return pickTopInsights(merged, 1);
};
