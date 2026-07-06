import { Typography } from "@/components/atoms/Typography";
import React from "react";
import { Pressable, View } from "react-native";

import type { StatsToggleChipsProps } from "./types";

export const StatsToggleChips = <T extends string>({
  options,
  value,
  onChange,
  labels,
  layout = "wrap",
}: StatsToggleChipsProps<T>) => {
  return (
    <View className={layout === "row" ? "flex-row flex-nowrap gap-2.5" : "flex-row flex-wrap gap-2.5"}>
      {options.map((option) => {
        const selected = option === value;
        return (
          <Pressable
            key={option}
            onPress={() => onChange(option)}
            className={`px-4 py-2.5 rounded-full border ${
              selected ? "bg-blue-900 border-blue-900" : "bg-gray-50 border-gray-200"
            }`}
          >
            <Typography variant="text-12-bold" className={selected ? "text-white" : "text-gray-800"}>
              {labels[option]}
            </Typography>
          </Pressable>
        );
      })}
    </View>
  );
};
