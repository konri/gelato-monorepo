import React, { useMemo } from "react";
import { View } from "react-native";
import { PieChart } from "react-native-gifted-charts";

import type { StatsDonutChartProps } from "./types";

export const StatsDonutChart = ({ size, thickness, segments }: StatsDonutChartProps) => {
  const radius = Math.max(8, size / 2 - 1);
  const innerRadius = Math.max(0, radius - thickness);

  const pieData = useMemo(() => {
    const safe = segments.map((s) => ({
      value: Number.isFinite(s.value) && s.value > 0 ? s.value : 0,
      color: s.color,
    }));
    const total = safe.reduce((acc, s) => acc + s.value, 0);
    if (total <= 0 || innerRadius >= radius) {
      return [{ value: 1, color: "#E5E7EB" }];
    }
    const positive = safe.filter((s) => s.value > 0);
    return positive.length > 0 ? positive : [{ value: 1, color: "#E5E7EB" }];
  }, [innerRadius, radius, segments]);

  if (innerRadius >= radius) {
    return <View style={{ width: size, height: size }} />;
  }

  return (
    <View className="items-center justify-center" style={{ width: size, height: size }}>
      <PieChart
        data={pieData}
        donut
        radius={radius}
        innerRadius={innerRadius}
        innerCircleColor="#FFFFFF"
        isAnimated
        animationDuration={600}
        showText={false}
      />
    </View>
  );
};
