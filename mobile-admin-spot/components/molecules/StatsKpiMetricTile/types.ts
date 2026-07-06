import type { MerchantStatsMetricDeltaRow } from "@/shared/api-client/src/stats/types";

export type StatsKpiMetricTileProps = {
  label: string;
  value: number;
  displayValue?: string;
  locale: string;
  deltaRow?: MerchantStatsMetricDeltaRow | null;
  showDelta: boolean;
  notApplicableLabel: string;
  boxClassName?: string;
};
