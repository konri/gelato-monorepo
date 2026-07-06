import { Typography } from "@/components/atoms/Typography";
import React from "react";
import { Pressable } from "react-native";
import type { SelectablePillProps } from "./types";

export function SelectablePill({ label, selected, onPress }: SelectablePillProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      className={`rounded-full-pill px-3 py-2 max-w-full bg-gray-100 border ${
        selected ? "border-blue-900" : "border-gray-200"
      }`}
    >
      <Typography
        variant={selected ? "text-12-semibold" : "text-12-regular"}
        className="text-black"
        numberOfLines={2}
      >
        {label}
      </Typography>
    </Pressable>
  );
}
