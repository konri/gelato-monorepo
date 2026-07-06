import { Typography } from "@/components/atoms/Typography";
import React from "react";
import { View } from "react-native";

import type { StatsScreenHeadingProps } from "./types";

export const StatsScreenHeading = ({ title, subtitle }: StatsScreenHeadingProps) => {
  return (
    <View className="gap-2">
      <Typography variant="text-24-bold" className="text-gray-900">
        {title}
      </Typography>
      {subtitle ? (
        <Typography variant="text-14-regular-spaced" className="text-gray-700 leading-snug">
          {subtitle}
        </Typography>
      ) : null}
    </View>
  );
};
