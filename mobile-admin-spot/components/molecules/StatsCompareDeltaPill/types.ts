import type { MerchantStatsKpiDeltaParts } from "@/utils/merchantStatsMetricDelta";

export type StatsCompareDeltaPillProps = {
  parts: MerchantStatsKpiDeltaParts;
  deltaPositive: boolean;
  contextSuffix?: string;
  notApplicableLabel?: string;
  className?: string;
  textAlignEnd?: boolean;
  numberOfLines?: 1 | 2;
};
