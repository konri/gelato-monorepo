import { Typography } from "@/components/atoms/Typography";
import React from "react";
import { Pressable, View } from "react-native";

import type { StatsCustomPeriodPickersProps } from "./types";

export const StatsCustomPeriodPickers = ({
  fromTitle,
  toTitle,
  fromValue,
  toValue,
  onPressFrom,
  onPressTo,
}: StatsCustomPeriodPickersProps) => {
  return (
    <View className="flex-row flex-wrap gap-2">
      <Pressable
        onPress={onPressFrom}
        className="flex-1 min-w-35.5 bg-white border border-gray-200 rounded-xl px-3 py-3 active:opacity-90 gap-1"
      >
        <Typography variant="text-12-semibold" className="text-gray-600 uppercase tracking-wide">
          {fromTitle}
        </Typography>
        <Typography variant="text-14-semibold" className="text-gray-900">
          {fromValue}
        </Typography>
      </Pressable>
      <Pressable
        onPress={onPressTo}
        className="flex-1 min-w-35.5 bg-white border border-gray-200 rounded-xl px-3 py-3 active:opacity-90 gap-1"
      >
        <Typography variant="text-12-semibold" className="text-gray-600 uppercase tracking-wide">
          {toTitle}
        </Typography>
        <Typography variant="text-14-semibold" className="text-gray-900">
          {toValue}
        </Typography>
      </Pressable>
    </View>
  );
};
