import {
  STATS_INSIGHT_MIN_MILESTONES,
  STATS_INSIGHT_REDEMPTION_GAP_PP,
} from "@/constants/merchantStatsInsightThresholds";
import type { MerchantStatsBundleData } from "@/shared/api-client/src/graphql/queries/merchantStats";

import { pickTopInsights } from "./pickTopInsights";
import type { MerchantStatsInsightItem } from "./types";

export const collectPointsRewardsInsightCandidates = (
  bundle: MerchantStatsBundleData,
): MerchantStatsInsightItem[] => {
  const items: MerchantStatsInsightItem[] = [];
  const stamps = bundle.stamps;
  const rewards = bundle.rewards;

  if (stamps && stamps.milestonesClaimedInPeriod >= STATS_INSIGHT_MIN_MILESTONES) {
    const claimed = stamps.milestonesClaimedInPeriod;
    const redeemed = stamps.milestonesRedeemedInPeriod;
    const rate = claimed > 0 ? redeemed / claimed : 0;
    if (rate < 0.62) {
      items.push({
        priority: 83,
        variant: "warn",
        titleKey: "MerchantStats.insightMilestoneRedeemLowTitle",
        bodyKey: "MerchantStats.insightMilestoneRedeemLowBody",
        params: {
          percent: Math.round(rate * 100),
          redeemed,
          claimed,
          gap: claimed - redeemed,
        },
      });
    } else if (rate >= 0.82) {
      items.push({
        priority: 36,
        variant: "good",
        titleKey: "MerchantStats.insightMilestoneRedeemGoodTitle",
        bodyKey: "MerchantStats.insightMilestoneRedeemGoodBody",
        params: { percent: Math.round(rate * 100) },
      });
    }
  }

  if (rewards && rewards.topRewardsInPeriod.length > 0) {
    const bundleRate = rewards.redemptionRate;
    if (Number.isFinite(bundleRate) && bundleRate > 0.05) {
      type TopRow = (typeof rewards.topRewardsInPeriod)[number];
      let worst: { row: TopRow; gap: number; rate: number } | null = null;
      for (const r of rewards.topRewardsInPeriod) {
        const rr = r.redemptionRate;
        if (rr === null || rr === undefined || !Number.isFinite(rr)) {
          continue;
        }
        const gap = bundleRate - rr;
        if (gap < STATS_INSIGHT_REDEMPTION_GAP_PP) {
          continue;
        }
        if (!worst || gap > worst.gap) {
          worst = { row: r, gap, rate: rr };
        }
      }
      if (worst) {
        items.push({
          priority: 78,
          variant: "info",
          titleKey: "MerchantStats.insightRewardBelowAvgTitle",
          bodyKey: "MerchantStats.insightRewardBelowAvgBody",
          params: {
            title: worst.row.title,
            rate: Math.round(worst.rate * 100),
            avg: Math.round(bundleRate * 100),
          },
        });
      }
    }
  }

  return items;
};

export const buildPointsRewardsStatsInsights = (bundle: MerchantStatsBundleData): MerchantStatsInsightItem[] =>
  pickTopInsights(collectPointsRewardsInsightCandidates(bundle));
