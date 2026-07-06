import { giftedLineMaxValue, giftedLineSpacing, toGiftedLineData } from "@/utils/merchantStatsGiftedLine";
import React, { useMemo } from "react";
import { View } from "react-native";
import { LineChart } from "react-native-gifted-charts";

import type { StatsMultiSeriesLineChartProps } from "./types";

const PAD_X = 2;

export const StatsMultiSeriesLineChart = ({
  width,
  height,
  primaryValues,
  comparisonValues,
  primaryColor,
  comparisonColor,
}: StatsMultiSeriesLineChartProps) => {
  const primaryData = useMemo(() => toGiftedLineData(primaryValues), [primaryValues]);
  const comparisonData = useMemo(() => toGiftedLineData(comparisonValues), [comparisonValues]);

  const n = Math.min(primaryData.length, comparisonData.length);
  const d1 = useMemo(() => comparisonData.slice(0, n), [comparisonData, n]);
  const d2 = useMemo(() => primaryData.slice(0, n), [n, primaryData]);

  const maxValue = useMemo(
    () => giftedLineMaxValue(comparisonValues.slice(0, n), primaryValues.slice(0, n)),
    [comparisonValues, n, primaryValues],
  );

  const spacing = useMemo(() => giftedLineSpacing(width, PAD_X, n), [n, width]);

  if (n === 0 || width <= 0 || height <= 0) {
    return null;
  }

  return (
    <View>
      <LineChart
        parentWidth={width}
        width={width}
        height={height}
        data={d1}
        data2={d2}
        maxValue={maxValue}
        spacing={spacing}
        initialSpacing={PAD_X}
        endSpacing={PAD_X}
        thickness={2}
        thickness2={2}
        color={comparisonColor}
        color2={primaryColor}
        strokeDashArray={[5, 4]}
        yAxisExtraHeight={6}
        hideAxesAndRules
        hideYAxisText
        xAxisThickness={0}
        yAxisThickness={0}
        disableScroll
        isAnimated
        animationDuration={560}
        hideDataPoints
        hideDataPoints2
        showValuesAsDataPointsText={false}
      />
    </View>
  );
};
