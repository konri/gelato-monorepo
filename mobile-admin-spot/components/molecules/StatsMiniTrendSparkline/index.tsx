import { giftedLineMaxValue, giftedLineSpacing, toGiftedLineData } from "@/utils/merchantStatsGiftedLine";
import React, { useMemo, useState } from "react";
import { View } from "react-native";
import { LineChart } from "react-native-gifted-charts";

import type { StatsMiniTrendSparklineProps } from "./types";

const PAD_X = 2;
const PAD_Y = 3;

export const StatsMiniTrendSparkline = ({
  values,
  accentColor,
  height = 32,
}: StatsMiniTrendSparklineProps) => {
  const [width, setWidth] = useState(0);

  const data = useMemo(() => toGiftedLineData(values), [values]);
  const maxValue = useMemo(() => giftedLineMaxValue(values), [values]);
  const spacing = useMemo(
    () => giftedLineSpacing(width, PAD_X, data.length),
    [data.length, width],
  );

  if (values.length === 0) {
    return null;
  }

  if (values.length === 1) {
    return (
      <View className="mt-2 w-full items-center justify-center" style={{ height }}>
        <View className="rounded-full w-2 h-2" style={{ backgroundColor: accentColor }} />
      </View>
    );
  }

  return (
    <View
      className="mt-2 w-full"
      style={{ height }}
      onLayout={(e) => {
        const w = e.nativeEvent.layout.width;
        if (w > 0 && Math.abs(w - width) > 0.5) {
          setWidth(w);
        }
      }}
    >
      {width > 0 ? (
        <LineChart
          parentWidth={width}
          width={width}
          height={height}
          data={data}
          maxValue={maxValue}
          spacing={spacing}
          initialSpacing={PAD_X}
          endSpacing={PAD_X}
          thickness={2}
          color={accentColor}
          yAxisExtraHeight={PAD_Y}
          hideAxesAndRules
          hideYAxisText
          xAxisThickness={0}
          yAxisThickness={0}
          disableScroll
          isAnimated
          animationDuration={480}
          hideDataPoints={data.length > 6}
          dataPointsRadius={2.25}
          dataPointsColor={accentColor}
          dataPointsWidth={4}
          dataPointsHeight={4}
          showValuesAsDataPointsText={false}
        />
      ) : null}
    </View>
  );
};
