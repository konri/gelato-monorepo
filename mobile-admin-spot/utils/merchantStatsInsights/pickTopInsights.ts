import { STATS_INSIGHT_MAX_PER_SCREEN } from "@/constants/merchantStatsInsightThresholds";

import type { MerchantStatsInsightItem } from "./types";

export const deltaPctIfAtMost = (
  deltaPct: number | null | undefined,
  max: number,
): number | undefined => {
  if (deltaPct === null || deltaPct === undefined || !Number.isFinite(deltaPct)) {
    return undefined;
  }
  if (deltaPct > max) {
    return undefined;
  }
  return deltaPct;
};

export const pickTopInsights = (
  items: MerchantStatsInsightItem[],
  max: number = STATS_INSIGHT_MAX_PER_SCREEN,
): MerchantStatsInsightItem[] => {
  const copy = [...items].sort((a, b) => b.priority - a.priority);
  return copy.slice(0, max);
};
