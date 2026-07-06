import {
  STATS_INSIGHT_COMPARE_DELTA_PCT_WARN,
  STATS_INSIGHT_MIN_STAMP_CARDS,
  STATS_INSIGHT_SHARE_COMPLETED_WARN,
  STATS_INSIGHT_STAMP_STEP_DROP_WARN,
} from "@/constants/merchantStatsInsightThresholds";
import type { MerchantStatsBundleData } from "@/shared/api-client/src/graphql/queries/merchantStats";

import { deltaPctIfAtMost, pickTopInsights } from "./pickTopInsights";
import type { MerchantStatsInsightItem } from "./types";

const COMPARE_FUNNEL_INSIGHTS: Record<
  string,
  { titleKey: string; bodyKey: string }
> = {
  "funnels.stampCardFunnel.shareCompleted": {
    titleKey: "MerchantStats.insightCompareShareCompletedDownTitle",
    bodyKey: "MerchantStats.insightCompareShareCompletedDownBody",
  },
  "funnels.stampCardFunnel.shareWithStamp": {
    titleKey: "MerchantStats.insightCompareShareStampDownTitle",
    bodyKey: "MerchantStats.insightCompareShareStampDownBody",
  },
};

export const collectClientsInsightCandidates = (bundle: MerchantStatsBundleData): MerchantStatsInsightItem[] => {
  const items: MerchantStatsInsightItem[] = [];
  const funnel = bundle.funnels?.stampCardFunnel;
  const showCompare = bundle.analytics?.compareMode !== "none";
  const deltas = bundle.analytics?.metricDeltas ?? [];

  if (funnel && funnel.cardsTotal >= STATS_INSIGHT_MIN_STAMP_CARDS) {
    const total = funnel.cardsTotal;
    const withS = funnel.cardsWithAtLeastOneStamp;
    const done = funnel.cardsCompleted;
    const dropIssuedToStamp = total > 0 ? 1 - withS / total : 0;
    const dropStampToDone = withS > 0 ? 1 - done / withS : 0;

    if (
      withS < total &&
      dropIssuedToStamp >= STATS_INSIGHT_STAMP_STEP_DROP_WARN &&
      dropIssuedToStamp >= dropStampToDone
    ) {
      items.push({
        priority: 88,
        variant: "warn",
        titleKey: "MerchantStats.insightStampDropIssuedTitle",
        bodyKey: "MerchantStats.insightStampDropIssuedBody",
        params: {
          percent: Math.round(dropIssuedToStamp * 100),
          withStamp: withS,
          total,
        },
      });
    } else if (dropStampToDone >= STATS_INSIGHT_STAMP_STEP_DROP_WARN) {
      items.push({
        priority: 87,
        variant: "warn",
        titleKey: "MerchantStats.insightStampDropProgressTitle",
        bodyKey: "MerchantStats.insightStampDropProgressBody",
        params: {
          percent: Math.round(dropStampToDone * 100),
          completed: done,
          withStamp: withS,
        },
      });
    }

    if (funnel.shareCompleted < STATS_INSIGHT_SHARE_COMPLETED_WARN && total >= 10) {
      items.push({
        priority: 82,
        variant: "bad",
        titleKey: "MerchantStats.insightStampCompletionLowTitle",
        bodyKey: "MerchantStats.insightStampCompletionLowBody",
        params: {
          percent: Math.round(funnel.shareCompleted * 100),
          completed: done,
          total,
        },
      });
    }
  }

  if (showCompare) {
    const deltaByPath = new Map(deltas.map((d) => [d.path, d]));
    for (const [path, keys] of Object.entries(COMPARE_FUNNEL_INSIGHTS)) {
      const row = deltaByPath.get(path);
      const dp = row ? deltaPctIfAtMost(row.deltaPct, STATS_INSIGHT_COMPARE_DELTA_PCT_WARN) : undefined;
      if (dp === undefined) {
        continue;
      }
      items.push({
        priority: 92,
        variant: "bad",
        titleKey: keys.titleKey,
        bodyKey: keys.bodyKey,
        params: { deltaPct: Math.round(Math.abs(dp) * 100) },
      });
    }
  }

  return items;
};

export const buildClientsStatsInsights = (bundle: MerchantStatsBundleData): MerchantStatsInsightItem[] =>
  pickTopInsights(collectClientsInsightCandidates(bundle));
