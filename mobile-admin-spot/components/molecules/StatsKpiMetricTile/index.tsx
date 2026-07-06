import { Typography } from "@/components/atoms/Typography";
import { StatsCompareDeltaPill } from "@/components/molecules/StatsCompareDeltaPill";
import { formatInteger } from "@/utils/merchantStatsFormat";
import { formatMerchantStatsKpiDeltaParts } from "@/utils/merchantStatsMetricDelta";
import React from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import type { StatsKpiMetricTileProps } from "./types";

const defaultBoxClass =
  "flex-1 min-w-40 max-w-1/2 grow bg-white rounded-2xl p-3.5 border border-gray-100-light shadow-settings-card";

export const StatsKpiMetricTile = ({
  label,
  value,
  displayValue,
  locale,
  deltaRow,
  showDelta,
  notApplicableLabel,
  boxClassName = defaultBoxClass,
}: StatsKpiMetricTileProps) => {
  const { t } = useTranslation();
  const deltaParts =
    showDelta && deltaRow
      ? formatMerchantStatsKpiDeltaParts(deltaRow, locale, notApplicableLabel)
      : null;
  const deltaPositive = deltaRow ? deltaRow.delta >= 0 : true;

  return (
    <View className={boxClassName}>
      <Typography variant="text-12-regular" className="text-gray-500 leading-4" numberOfLines={3}>
        {label}
      </Typography>
      <Typography variant="text-20-bold" className="text-gray-900 mt-1">
        {displayValue ?? formatInteger(value, locale)}
      </Typography>
      {deltaParts ? (
        <View className="mt-2.5 pt-2.5 border-t border-gray-100 gap-1">
          <Typography variant="text-12-semibold" className="text-gray-500">
            {t("MerchantStats.kpiDeltaCaption")}
          </Typography>
          <StatsCompareDeltaPill parts={deltaParts} deltaPositive={deltaPositive} className="self-start" />
        </View>
      ) : null}
    </View>
  );
};
