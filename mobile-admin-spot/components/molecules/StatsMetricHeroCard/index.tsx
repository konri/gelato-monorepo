import { Typography } from "@/components/atoms/Typography";
import React from "react";
import { View } from "react-native";

import type { StatsMetricHeroCardAccent, StatsMetricHeroCardProps } from "./types";

const headerClass: Record<StatsMetricHeroCardAccent, string> = {
  blue: "bg-blue-extra-light px-4 py-3 border-b border-gray-100-light",
  emerald: "bg-emerald-50 px-4 py-3 border-b border-gray-100-light",
};

const frameBorderClass: Record<StatsMetricHeroCardAccent, string> = {
  blue: "border-gray-100-light",
  emerald: "border-gray-100-light",
};

export const StatsMetricHeroCard = ({ accent, label, value, detail }: StatsMetricHeroCardProps) => {
  return (
    <View
      className={`rounded-3xl border ${frameBorderClass[accent]} bg-white overflow-hidden shadow-settings-card`}
    >
      <View className={headerClass[accent]}>
        <Typography variant="text-14-semibold" className="text-gray-700 leading-snug">
          {label}
        </Typography>
      </View>
      <View className="p-4 gap-3">
        <Typography variant="text-32-semibold-38" className="text-gray-900">
          {value}
        </Typography>
        {detail}
      </View>
    </View>
  );
};
