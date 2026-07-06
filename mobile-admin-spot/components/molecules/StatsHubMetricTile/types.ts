import type { MerchantStatsMetricDeltaRow } from "@/shared/api-client/src/stats/types";

export type StatsHubMetricTileProps = {
  label: string;
  value: string;
  locale: string;
  deltaRow?: MerchantStatsMetricDeltaRow | null;
  showDelta: boolean;
  notApplicableLabel: string;
  sparklineValues?: number[];
  sparklineAccentColor?: string;
  trendCaption?: string;
};
