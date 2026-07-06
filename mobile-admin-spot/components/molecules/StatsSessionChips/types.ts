import type { StatsCompareMode } from "@/shared/api-client/src/stats/types";
import type { StatsPeriodPresetId } from "@/utils/merchantStatsPeriod";

export type StatsPeriodChipsProps = {
  value: StatsPeriodPresetId;
  onChange: (next: StatsPeriodPresetId) => void;
  labels: Record<StatsPeriodPresetId, string>;
  layout?: "wrap" | "row";
};

export type StatsCompareModeChipsProps = {
  value: StatsCompareMode;
  onChange: (next: StatsCompareMode) => void;
  labels: Record<StatsCompareMode, string>;
  layout?: "wrap" | "row";
};

export type StatsNetworkStoreScope = "network" | "context_store";

export type StatsNetworkStoreScopeChipsProps = {
  value: StatsNetworkStoreScope;
  onChange: (next: StatsNetworkStoreScope) => void;
  labels: Record<StatsNetworkStoreScope, string>;
  layout?: "wrap" | "row";
};
