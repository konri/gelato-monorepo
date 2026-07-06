import { Typography } from "@/components/atoms/Typography";
import type { MerchantStatsKpiDeltaParts } from "@/utils/merchantStatsMetricDelta";
import React from "react";
import { View } from "react-native";
import { twMerge } from "tailwind-merge";

import type { StatsCompareDeltaPillProps } from "./types";

const stripLeadingSign = (line: string) => line.replace(/^[+-]/u, "");

type ResolvedPill = { wrapBg: string; textClass: string; content: string };

const resolvePill = (input: {
  parts: MerchantStatsKpiDeltaParts;
  deltaPositive: boolean;
  suffix: string;
  showNaOnly: boolean;
  notApplicableLabel?: string;
}): ResolvedPill => {
  const { parts, deltaPositive, suffix, showNaOnly, notApplicableLabel } = input;

  if (parts.isNeutralChange) {
    const raw =
      parts.percentLine !== null
        ? stripLeadingSign(parts.percentLine)
        : stripLeadingSign(parts.absoluteLine);
    return {
      wrapBg: "bg-gray-100",
      textClass: "text-gray-700",
      content: `${raw}${suffix}`,
    };
  }

  if (showNaOnly) {
    return {
      wrapBg: "bg-gray-100",
      textClass: "text-gray-500",
      content: notApplicableLabel ?? "",
    };
  }

  const up = deltaPositive;
  const body =
    parts.percentLine !== null
      ? `${up ? "▲ " : "▼ "}${stripLeadingSign(parts.percentLine)}`
      : parts.absoluteLine;

  return {
    wrapBg: up ? "bg-emerald-50" : "bg-red-50",
    textClass: up ? "text-emerald-700" : "text-red-600",
    content: `${body}${suffix}`,
  };
};

export const StatsCompareDeltaPill = ({
  parts,
  deltaPositive,
  contextSuffix,
  notApplicableLabel,
  className,
  textAlignEnd = false,
  numberOfLines = 2,
}: StatsCompareDeltaPillProps) => {
  const suffix = contextSuffix ? ` ${contextSuffix}` : "";
  const showNaOnly =
    !parts.isNeutralChange &&
    parts.percentLine === null &&
    Boolean(notApplicableLabel);

  const { wrapBg, textClass, content } = resolvePill({
    parts,
    deltaPositive,
    suffix,
    showNaOnly,
    notApplicableLabel,
  });

  return (
    <View className={twMerge("px-2 py-0.5 rounded-full max-w-full", wrapBg, className)}>
      <Typography
        variant="text-12-bold"
        className={twMerge(textClass, textAlignEnd ? "text-right" : "")}
        numberOfLines={numberOfLines}
        ellipsizeMode="tail"
      >
        {content}
      </Typography>
    </View>
  );
};
