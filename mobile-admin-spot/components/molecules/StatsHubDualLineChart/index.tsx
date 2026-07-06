import { giftedLineMaxValue, giftedLineSpacing, toGiftedLineData } from "@/utils/merchantStatsGiftedLine";
import React, { useCallback, useMemo, useState } from "react";
import { View, type LayoutChangeEvent } from "react-native";
import { LineChart } from "react-native-gifted-charts";

import type { StatsHubDualLineChartProps } from "./types";

const PAD_X = 4;
const PAD_Y = 6;

export const StatsHubDualLineChart = ({
  primaryValues,
  compareValues,
  primaryColor,
  compareColor,
  height = 76,
}: StatsHubDualLineChartProps) => {
  const [width, setWidth] = useState(0);

  const primaryData = useMemo(() => toGiftedLineData(primaryValues), [primaryValues]);
  const compareData = useMemo(() => {
    if (compareValues === null || compareValues === undefined || compareValues.length === 0) {
      return null;
    }
    return toGiftedLineData(compareValues);
  }, [compareValues]);

  const maxValue = useMemo(() => {
    const primaryNums = primaryData.map((d) => d.value);
    if (compareData !== null && compareData.length === primaryData.length) {
      return giftedLineMaxValue(
        primaryNums,
        compareData.map((d) => d.value),
      );
    }
    return giftedLineMaxValue(primaryNums);
  }, [compareData, primaryData]);

  const pointCount = primaryData.length;
  const spacing = useMemo(
    () => giftedLineSpacing(width, PAD_X, pointCount),
    [pointCount, width],
  );

  const onLayout = useCallback(
    (e: LayoutChangeEvent) => {
      const w = e.nativeEvent.layout.width;
      if (w > 0 && Math.abs(w - width) > 0.5) {
        setWidth(w);
      }
    },
    [width],
  );

  if (primaryValues.length === 0) {
    return null;
  }

  const showCompare =
    compareData !== null && compareData.length === primaryData.length;

  return (
    <View className="w-full" style={{ height }} onLayout={onLayout}>
      {width > 0 ? (
        <LineChart
          parentWidth={width}
          width={width}
          height={height}
          data={showCompare ? compareData : primaryData}
          data2={showCompare ? primaryData : undefined}
          maxValue={maxValue}
          spacing={spacing}
          initialSpacing={PAD_X}
          endSpacing={PAD_X}
          thickness={showCompare ? 1.75 : 2.25}
          thickness2={2.25}
          color={showCompare ? compareColor : primaryColor}
          color2={primaryColor}
          strokeDashArray={showCompare ? [5, 5] : undefined}
          yAxisExtraHeight={PAD_Y}
          hideAxesAndRules
          hideYAxisText
          xAxisThickness={0}
          yAxisThickness={0}
          disableScroll
          isAnimated
          animationDuration={520}
          hideDataPoints
          hideDataPoints2
          showValuesAsDataPointsText={false}
        />
      ) : null}
    </View>
  );
};
