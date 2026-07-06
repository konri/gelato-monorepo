import { Typography } from "@/components/atoms/Typography";
import { StatsCompareDeltaPill } from "@/components/molecules/StatsCompareDeltaPill";
import { StatsMiniTrendSparkline } from "@/components/molecules/StatsMiniTrendSparkline";
import { formatMerchantStatsKpiDeltaParts } from "@/utils/merchantStatsMetricDelta";
import React from "react";
import { View } from "react-native";

import type { StatsHubMetricTileProps } from "./types";

export const StatsHubMetricTile = ({
  label,
  value,
  locale,
  deltaRow,
  showDelta,
  notApplicableLabel,
  sparklineValues,
  sparklineAccentColor,
  trendCaption,
}: StatsHubMetricTileProps) => {
  const deltaParts =
    showDelta && deltaRow
      ? formatMerchantStatsKpiDeltaParts(deltaRow, locale, notApplicableLabel)
      : null;
  const deltaPositive = deltaRow ? deltaRow.delta >= 0 : true;

  return (
    <View className="flex-1 min-w-2/5 max-w-1/2 grow bg-white rounded-2xl p-3.5 border border-gray-100-light min-h-32 flex-col shadow-settings-card">
      <Typography variant="text-12-semibold" className="text-gray-700 leading-snug" numberOfLines={2}>
        {label}
      </Typography>
      <Typography variant="text-20-bold" className="text-gray-900 mt-1">
        {value}
      </Typography>
      <View className="flex-1 min-h-1" />
      {deltaParts ? (
        <View className="min-w-0 self-start max-w-full">
          <StatsCompareDeltaPill
            parts={deltaParts}
            deltaPositive={deltaPositive}
            className="mt-2 self-start"
            numberOfLines={1}
          />
        </View>
      ) : null}
      {sparklineValues &&
      sparklineValues.length > 0 &&
      typeof sparklineAccentColor === "string" &&
      sparklineAccentColor.length > 0 ? (
        <View>
          <StatsMiniTrendSparkline values={sparklineValues} accentColor={sparklineAccentColor} />
          {trendCaption ? (
            <Typography variant="text-12-regular" className="text-gray-500 mt-1 leading-snug">
              {trendCaption}
            </Typography>
          ) : null}
        </View>
      ) : null}
    </View>
  );
};
