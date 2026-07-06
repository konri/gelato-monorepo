import { Typography } from "@/components/atoms/Typography";
import React, { useMemo } from "react";
import { View } from "react-native";
import { BarChart } from "react-native-gifted-charts";

import type { StatsMetricPairBarChartProps } from "./types";
import { buildPairBarRowLayout } from "./utils/buildPairBarRowLayout";

const DEFAULT_LABEL_W = 112;
const ROW_CHART_HEIGHT = 46;
const PAD = 4;
const INNER_SPACING = 10;
const SCALE_MAX = 100;

export const StatsMetricPairBarChart = ({
  width,
  items,
  columnALabel,
  columnBLabel,
  barAColor = "#1A4196",
  barBColor = "#9CA3AF",
  formatValue,
  labelColumnWidth,
}: StatsMetricPairBarChartProps) => {
  const rowLabelW = labelColumnWidth ?? DEFAULT_LABEL_W;
  const chartW = Math.max(120, width - rowLabelW - PAD * 2);
  const half = (chartW - INNER_SPACING) / 2;
  const barWidth = Math.max(18, (chartW - INNER_SPACING - 8) / 2);
  const sidePad = Math.max(4, (chartW - INNER_SPACING - barWidth * 2) / 2);
  const initialSpacing = sidePad;
  const endSpacing = sidePad;

  const rows = useMemo(
    () =>
      items.map((item) => ({
        ...item,
        ...buildPairBarRowLayout({
          current: item.current,
          previous: item.previous,
          scaleMax: SCALE_MAX,
          barAColor,
          barBColor,
        }),
      })),
    [barAColor, barBColor, items],
  );

  return (
    <View className="gap-3">
      <View className="flex-row pl-1" style={{ paddingLeft: rowLabelW + PAD }}>
        <View style={{ width: half }} className="items-center">
          <Typography variant="text-12-semibold" className="text-gray-600 text-center" numberOfLines={2}>
            {columnALabel}
          </Typography>
        </View>
        <View style={{ width: INNER_SPACING }} />
        <View style={{ width: half }} className="items-center">
          <Typography variant="text-12-semibold" className="text-gray-600 text-center" numberOfLines={2}>
            {columnBLabel}
          </Typography>
        </View>
      </View>

      {rows.map((row, idx) => (
        <View key={`${row.label}-${idx}`} className="flex-row items-end">
          <View style={{ width: rowLabelW }} className="pr-2 pb-1 justify-end">
            {rowLabelW > 0 && row.label.trim().length > 0 ? (
              <Typography variant="text-12-semibold" className="text-gray-800" numberOfLines={3}>
                {row.label}
              </Typography>
            ) : null}
          </View>
          <View style={{ width: chartW }}>
            <BarChart
              parentWidth={chartW}
              width={chartW}
              height={ROW_CHART_HEIGHT}
              maxValue={SCALE_MAX}
              data={[
                { value: row.va, frontColor: row.colorA },
                { value: row.vb, frontColor: row.colorB },
              ]}
              barWidth={barWidth}
              spacing={INNER_SPACING}
              initialSpacing={initialSpacing}
              endSpacing={endSpacing}
              barBorderRadius={6}
              roundedTop
              roundedBottom
              hideRules
              yAxisThickness={0}
              xAxisThickness={0}
              hideYAxisText
              disableScroll
              isAnimated
              animationDuration={480}
              noOfSections={4}
            />
            <View className="flex-row mt-1" style={{ width: chartW }}>
              <View style={{ width: half }} className="items-center px-0.5">
                <Typography variant="text-12-bold" className="text-gray-900 text-center" numberOfLines={1}>
                  {formatValue(row.a)}
                </Typography>
              </View>
              <View style={{ width: INNER_SPACING }} />
              <View style={{ width: half }} className="items-center px-0.5">
                <Typography variant="text-12-bold" className="text-gray-600 text-center" numberOfLines={1}>
                  {formatValue(row.b)}
                </Typography>
              </View>
            </View>
          </View>
        </View>
      ))}
    </View>
  );
};
