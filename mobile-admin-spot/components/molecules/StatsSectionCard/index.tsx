import { Typography } from "@/components/atoms/Typography";
import { MERCHANT_STATS_SECTION_CARD_SURFACE_CLASS } from "@/constants/merchantStatsUi";
import React from "react";
import { View } from "react-native";

import type { StatsSectionCardProps } from "./types";

export const StatsSectionCard = ({
  title,
  subtitle,
  errorText,
  children,
}: StatsSectionCardProps) => {
  return (
    <View className={MERCHANT_STATS_SECTION_CARD_SURFACE_CLASS}>
      <View className="gap-1.5">
        <Typography variant="text-18-semibold" className="text-gray-900">
          {title}
        </Typography>
        {subtitle ? (
          <Typography variant="text-14-regular-spaced" className="text-gray-700 leading-snug">
            {subtitle}
          </Typography>
        ) : null}
        {errorText ? (
          <Typography variant="text-14-semibold" className="text-red-600">
            {errorText}
          </Typography>
        ) : null}
      </View>
      {children}
    </View>
  );
};
