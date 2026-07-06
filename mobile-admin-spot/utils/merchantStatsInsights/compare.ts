import { STATS_INSIGHT_COMPARE_DELTA_PCT_WARN } from "@/constants/merchantStatsInsightThresholds";
import type { MerchantStatsBundleData } from "@/shared/api-client/src/graphql/queries/merchantStats";
import type { MerchantStatsMetricDeltaRow } from "@/shared/api-client/src/stats/types";

import { pickTopInsights } from "./pickTopInsights";
import type { MerchantStatsInsightItem } from "./types";

const COMPARE_INSIGHT_ALLOWLIST = new Set<string>([
  "users.distinctClientsActiveInPeriod",
  "users.newLoyaltyCardsIssuedInPeriod",
  "users.newClientsFirstActivityInPeriod",
  "stamps.stampsEarnedTotalInPeriod",
  "rewards.userRewardsRedeemedInPeriod",
  "rewards.userRewardsCreatedInPeriod",
  "points.merchantPointsEarnedInPeriod",
  "coupons.couponUsagesInPeriod",
  "streaks.totalVisitsInPeriod",
  "streaks.totalRewardClaimsInPeriod",
  "funnels.couponFunnel.claimToUseRate",
  "funnels.stampCardFunnel.shareCompleted",
]);

const PATH_TO_KEYS: Record<string, { titleKey: string; bodyKey: string }> = {
  "users.distinctClientsActiveInPeriod": {
    titleKey: "MerchantStats.insightCompareGenericDownTitle",
    bodyKey: "MerchantStats.insightCompareActiveClientsDownBody",
  },
  "users.newLoyaltyCardsIssuedInPeriod": {
    titleKey: "MerchantStats.insightCompareGenericDownTitle",
    bodyKey: "MerchantStats.insightCompareNewCardsDownBody",
  },
  "users.newClientsFirstActivityInPeriod": {
    titleKey: "MerchantStats.insightCompareGenericDownTitle",
    bodyKey: "MerchantStats.insightCompareNewClientsDownBody",
  },
  "stamps.stampsEarnedTotalInPeriod": {
    titleKey: "MerchantStats.insightCompareGenericDownTitle",
    bodyKey: "MerchantStats.insightCompareStampsDownBody",
  },
  "rewards.userRewardsRedeemedInPeriod": {
    titleKey: "MerchantStats.insightCompareGenericDownTitle",
    bodyKey: "MerchantStats.insightCompareRewardsRedeemedDownBody",
  },
  "rewards.userRewardsCreatedInPeriod": {
    titleKey: "MerchantStats.insightCompareGenericDownTitle",
    bodyKey: "MerchantStats.insightCompareRewardsCreatedDownBody",
  },
  "points.merchantPointsEarnedInPeriod": {
    titleKey: "MerchantStats.insightCompareGenericDownTitle",
    bodyKey: "MerchantStats.insightComparePointsEarnedDownBody",
  },
  "coupons.couponUsagesInPeriod": {
    titleKey: "MerchantStats.insightCompareGenericDownTitle",
    bodyKey: "MerchantStats.insightCompareCouponUsagesDownBody",
  },
  "streaks.totalVisitsInPeriod": {
    titleKey: "MerchantStats.insightCompareGenericDownTitle",
    bodyKey: "MerchantStats.insightCompareStreakVisitsDownBody",
  },
  "streaks.totalRewardClaimsInPeriod": {
    titleKey: "MerchantStats.insightCompareGenericDownTitle",
    bodyKey: "MerchantStats.insightCompareStreakClaimsDownBody",
  },
  "funnels.couponFunnel.claimToUseRate": {
    titleKey: "MerchantStats.insightCompareGenericDownTitle",
    bodyKey: "MerchantStats.insightCompareClaimUseDownBody",
  },
  "funnels.stampCardFunnel.shareCompleted": {
    titleKey: "MerchantStats.insightCompareGenericDownTitle",
    bodyKey: "MerchantStats.insightCompareShareCompletedDownBody",
  },
};

const isCompareInsightNegativeRow = (
  d: MerchantStatsMetricDeltaRow,
): d is MerchantStatsMetricDeltaRow & { deltaPct: number } =>
  COMPARE_INSIGHT_ALLOWLIST.has(d.path) &&
  d.deltaPct !== null &&
  Number.isFinite(d.deltaPct) &&
  d.deltaPct <= STATS_INSIGHT_COMPARE_DELTA_PCT_WARN;

export const collectCompareInsightCandidates = (bundle: MerchantStatsBundleData): MerchantStatsInsightItem[] => {
  const items: MerchantStatsInsightItem[] = [];
  if (bundle.analytics?.compareMode === "none") {
    return items;
  }
  const deltas = bundle.analytics?.metricDeltas ?? [];
  const negatives = deltas.filter(isCompareInsightNegativeRow);
  negatives.sort((a, b) => a.deltaPct - b.deltaPct);

  for (const row of negatives.slice(0, 3)) {
    const keys = PATH_TO_KEYS[row.path];
    if (!keys) {
      continue;
    }
    items.push({
      priority: 70,
      variant: "bad",
      titleKey: keys.titleKey,
      bodyKey: keys.bodyKey,
      params: { deltaPct: Math.round(Math.abs(row.deltaPct) * 100) },
    });
  }

  return items;
};

export const buildCompareStatsInsights = (bundle: MerchantStatsBundleData): MerchantStatsInsightItem[] =>
  pickTopInsights(collectCompareInsightCandidates(bundle));
