import React, { useMemo } from "react";
import { View } from "react-native";
import { BarChart } from "react-native-gifted-charts";

import type { StatsWeekdayBarChartProps } from "./types";

const CHART_HEIGHT = 132;

export const StatsWeekdayBarChart = ({
  width,
  values,
  labels,
  barColor = "#1A4196",
}: StatsWeekdayBarChartProps) => {
  const { data, maxValue } = useMemo(() => {
    let maxCandidate = 0;
    const data = labels.map((label, i) => {
      const raw = values[i];
      const v = typeof raw === "number" && Number.isFinite(raw) ? Math.max(0, raw) : 0;
      if (v > maxCandidate) {
        maxCandidate = v;
      }
      return {
        value: v,
        label,
        frontColor: barColor,
      };
    });
    return { data, maxValue: Math.max(1, maxCandidate) };
  }, [barColor, labels, values]);

  if (width <= 0 || data.length === 0) {
    return null;
  }

  return (
    <View className="items-center">
      <BarChart
        parentWidth={width}
        width={width}
        height={CHART_HEIGHT}
        data={data}
        maxValue={maxValue}
        barBorderRadius={6}
        roundedTop
        roundedBottom
        hideRules
        yAxisThickness={0}
        xAxisThickness={0}
        hideYAxisText
        xAxisLabelTextStyle={{ color: "#6B7280", fontSize: 10 }}
        labelsDistanceFromXaxis={6}
        disableScroll
        isAnimated
        animationDuration={520}
        noOfSections={4}
      />
    </View>
  );
};
