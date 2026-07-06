import { Typography } from "@/components/atoms/Typography";
import React from "react";
import { View } from "react-native";

import type { StatsMerchantStatsFiltersCardProps } from "./types";

export const StatsMerchantStatsFiltersCard = ({
  title,
  subtitle,
  children,
}: StatsMerchantStatsFiltersCardProps) => {
  return (
    <View className="gap-4">
      <View className="gap-2.5">
        <Typography variant="text-14-bold" className="text-black">
          {title}
        </Typography>
        {subtitle ? (
          <Typography variant="text-12-regular" className="text-gray-700">
            {subtitle}
          </Typography>
        ) : null}
      </View>
      <View className="gap-5">{children}</View>
    </View>
  );
};
