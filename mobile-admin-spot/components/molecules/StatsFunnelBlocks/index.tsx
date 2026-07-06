import { Typography } from "@/components/atoms/Typography";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { View } from "react-native";
import { twMerge } from "tailwind-merge";

import type { StatsConversionFunnelStepProps, StatsFunnelConnectorProps } from "./types";

const CONNECTOR_ICON_COLOR = "#C7C7CC";

export const StatsFunnelConnector = ({ caption }: StatsFunnelConnectorProps) => {
  return (
    <View className="flex-row items-center justify-center h-3 my-0.5 gap-1">
      <Ionicons name="arrow-down" size={12} color={CONNECTOR_ICON_COLOR} />
      <Typography variant="text-12-semibold" className="text-gray-500">
        {caption}
      </Typography>
    </View>
  );
};

const badgeToneClass: Record<NonNullable<StatsConversionFunnelStepProps["trailingBadgeTone"]>, string> = {
  ok: "bg-emerald-100",
  mid: "bg-amber-100",
  bad: "bg-red-100",
};

const badgeTextTone: Record<NonNullable<StatsConversionFunnelStepProps["trailingBadgeTone"]>, string> = {
  ok: "text-emerald-800",
  mid: "text-amber-900",
  bad: "text-red-700",
};

export const StatsConversionFunnelStep = ({
  label,
  valueNumeric,
  shareLabel,
  fillRatio,
  variant = "default",
  fillClassName = "bg-blue-100",
  trailingBadge,
  trailingBadgeTone,
}: StatsConversionFunnelStepProps) => {
  const pct = Math.min(100, Math.max(0, Number.isFinite(fillRatio) ? fillRatio * 100 : 0));
  const isEmphasis = variant === "emphasis";
  const barClass = isEmphasis ? "bg-blue-900" : fillClassName;
  const valuesOverDarkFill = isEmphasis && pct >= 92;
  const labelOverDarkFill = isEmphasis && pct >= 30;

  return (
    <View
      className={twMerge(
        "rounded-xl overflow-hidden border",
        isEmphasis ? "border-blue-900" : "border-gray-100",
      )}
    >
      <View className="relative min-h-10 justify-center bg-gray-100">
        <View className={twMerge("absolute left-0 top-0 bottom-0", barClass)} style={{ width: `${pct}%` }} />
        <View className="flex-row justify-between items-center gap-2 px-3 py-2.5 z-10">
          <Typography
            variant="text-12-semibold"
            className={twMerge(
              "flex-1 pr-2",
              isEmphasis ? (labelOverDarkFill ? "text-white" : "text-gray-900") : "text-gray-800",
            )}
            numberOfLines={2}
          >
            {label}
          </Typography>
          <View className="flex-row items-center gap-1.5 flex-shrink-0">
            <Typography
              variant="text-12-bold"
              className={isEmphasis ? (valuesOverDarkFill ? "text-white" : "text-gray-900") : "text-gray-900"}
            >
              {valueNumeric}
            </Typography>
            <Typography
              variant="text-12-regular"
              className={
                isEmphasis ? (valuesOverDarkFill ? "text-white/80" : "text-gray-600") : "text-gray-600"
              }
            >
              {shareLabel}
            </Typography>
            {trailingBadge && trailingBadgeTone ? (
              <View className={twMerge("px-1.5 py-0.5 rounded-md", badgeToneClass[trailingBadgeTone])}>
                <Typography variant="text-9-bold" className={badgeTextTone[trailingBadgeTone]}>
                  {trailingBadge}
                </Typography>
              </View>
            ) : null}
          </View>
        </View>
      </View>
    </View>
  );
};
