import { Typography } from "@/components/atoms/Typography";
import React from "react";
import { View } from "react-native";

import type { StatsHubHeroCardProps } from "./types";

export const StatsHubHeroCard = ({
  titleRow,
  scopeLine,
  value,
  deltaContent,
  chart,
  chartFootnote,
}: StatsHubHeroCardProps) => {
  return (
    <View className="rounded-3xl border border-gray-100-light bg-white shadow-settings-card overflow-hidden">
      <View className="bg-blue-extra-light px-4 pt-4 pb-3 border-b border-gray-100-light">
        <Typography variant="text-14-semibold" className="text-gray-800 leading-snug">
          {titleRow}
        </Typography>
        {scopeLine ? (
          <Typography variant="text-12-regular" className="text-gray-700 mt-1.5 leading-snug">
            {scopeLine}
          </Typography>
        ) : null}
      </View>
      <View className="p-4 gap-4">
        <View className="flex-row flex-wrap gap-4 items-stretch">
          <View
            className={`gap-2 justify-center min-w-0 ${chart ? "flex-1 basis-37" : "w-full flex-1"}`}
          >
            <Typography variant="text-32-semibold-38" className="text-gray-900 leading-none">
              {value}
            </Typography>
            {deltaContent}
          </View>
          {chart ? (
            <View className="flex-1 min-w-0 max-w-full basis-37 justify-center">{chart}</View>
          ) : null}
        </View>
        {chartFootnote ? (
          <Typography variant="text-12-regular" className="text-gray-700 leading-snug">
            {chartFootnote}
          </Typography>
        ) : null}
      </View>
    </View>
  );
};
