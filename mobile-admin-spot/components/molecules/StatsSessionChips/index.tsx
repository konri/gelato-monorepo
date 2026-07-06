import { StatsToggleChips } from "@/components/molecules/StatsToggleChips";
import type { StatsCompareMode } from "@/shared/api-client/src/stats/types";
import type { StatsPeriodPresetId } from "@/utils/merchantStatsPeriod";
import React from "react";

import type {
  StatsCompareModeChipsProps,
  StatsNetworkStoreScope,
  StatsNetworkStoreScopeChipsProps,
  StatsPeriodChipsProps,
} from "./types";

const PRESETS: StatsPeriodPresetId[] = ["7d", "30d", "90d", "month", "custom"];

const COMPARE_MODES: StatsCompareMode[] = ["none", "previous_period", "previous_year"];

const STORE_SCOPES: StatsNetworkStoreScope[] = ["network", "context_store"];

export const StatsPeriodChips = ({
  value,
  onChange,
  labels,
  layout = "wrap",
}: StatsPeriodChipsProps) => (
  <StatsToggleChips<StatsPeriodPresetId>
    options={PRESETS}
    value={value}
    onChange={onChange}
    labels={labels}
    layout={layout}
  />
);

export const StatsCompareModeChips = ({
  value,
  onChange,
  labels,
  layout = "wrap",
}: StatsCompareModeChipsProps) => (
  <StatsToggleChips<StatsCompareMode>
    options={COMPARE_MODES}
    value={value}
    onChange={onChange}
    labels={labels}
    layout={layout}
  />
);

export const StatsNetworkStoreScopeChips = ({
  value,
  onChange,
  labels,
  layout = "wrap",
}: StatsNetworkStoreScopeChipsProps) => (
  <StatsToggleChips<StatsNetworkStoreScope>
    options={STORE_SCOPES}
    value={value}
    onChange={onChange}
    labels={labels}
    layout={layout}
  />
);
