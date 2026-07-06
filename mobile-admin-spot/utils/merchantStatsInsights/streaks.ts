import {
  STATS_INSIGHT_MIN_STREAK_VISITS,
  STATS_INSIGHT_STREAK_CONV_WARN,
  STATS_INSIGHT_STREAK_VS_GLOBAL_GAP,
} from "@/constants/merchantStatsInsightThresholds";
import type { MerchantStatsBundleData } from "@/shared/api-client/src/graphql/queries/merchantStats";

import { pickTopInsights } from "./pickTopInsights";
import type { MerchantStatsInsightItem } from "./types";

export const collectStreaksInsightCandidates = (bundle: MerchantStatsBundleData): MerchantStatsInsightItem[] => {
  const items: MerchantStatsInsightItem[] = [];
  const streaks = bundle.streaks;
  if (!streaks) {
    return items;
  }

  const visits = streaks.totalVisitsInPeriod;
  const claims = streaks.totalRewardClaimsInPeriod;
  const globalConv = visits > 0 ? claims / visits : 0;

  if (visits >= STATS_INSIGHT_MIN_STREAK_VISITS && globalConv < STATS_INSIGHT_STREAK_CONV_WARN) {
    items.push({
      priority: 81,
      variant: "warn",
      titleKey: "MerchantStats.insightStreakConvLowTitle",
      bodyKey: "MerchantStats.insightStreakConvLowBody",
      params: {
        percent: Math.round(globalConv * 100),
        visits,
        claims,
      },
    });
  } else if (visits >= STATS_INSIGHT_MIN_STREAK_VISITS && globalConv >= 0.18) {
    items.push({
      priority: 34,
      variant: "good",
      titleKey: "MerchantStats.insightStreakConvGoodTitle",
      bodyKey: "MerchantStats.insightStreakConvGoodBody",
      params: { percent: Math.round(globalConv * 100) },
    });
  }

  if (globalConv > 0.05 && streaks.programBreakdown.length >= 2) {
    type Row = (typeof streaks.programBreakdown)[number];
    let worst: { row: Row; gap: number; conv: number } | null = null;
    for (const p of streaks.programBreakdown) {
      const v = p.visitsInPeriod;
      if (v < STATS_INSIGHT_MIN_STREAK_VISITS) {
        continue;
      }
      const conv = p.rewardClaimsInPeriod / v;
      const gap = globalConv - conv;
      if (gap < STATS_INSIGHT_STREAK_VS_GLOBAL_GAP) {
        continue;
      }
      if (!worst || gap > worst.gap) {
        worst = { row: p, gap, conv };
      }
    }
    if (worst) {
      items.push({
        priority: 76,
        variant: "warn",
        titleKey: "MerchantStats.insightStreakProgramLagTitle",
        bodyKey: "MerchantStats.insightStreakProgramLagBody",
        params: {
          name: worst.row.name,
          percent: Math.round(worst.conv * 100),
          globalPercent: Math.round(globalConv * 100),
        },
      });
    }
  }

  return items;
};

export const buildStreaksStatsInsights = (bundle: MerchantStatsBundleData): MerchantStatsInsightItem[] =>
  pickTopInsights(collectStreaksInsightCandidates(bundle));
