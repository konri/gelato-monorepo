import { Typography } from "@/components/atoms/Typography";
import React from "react";
import { Pressable } from "react-native";

import type { StatsFilterPickerRowProps } from "./types";

export const StatsFilterPickerRow = ({ caption, valueLabel, onPress }: StatsFilterPickerRowProps) => {
  return (
    <Pressable
      onPress={onPress}
      className="bg-gray-50 border border-gray-100-light rounded-2xl px-3.5 py-3.5 active:opacity-90"
    >
      <Typography variant="text-12-semibold" className="text-gray-600">
        {caption}
      </Typography>
      <Typography variant="text-14-semibold" className="text-gray-900 mt-0.5">
        {valueLabel}
      </Typography>
    </Pressable>
  );
};
