import { Typography } from "@/components/atoms/Typography";
import { SelectablePill } from "@/components/molecules/SelectablePill";
import React from "react";
import { View } from "react-native";
import type { LoyaltyFilterPillSectionProps } from "./types";

export function LoyaltyFilterPillSection<T extends string>({
  title,
  hint,
  options,
  selectedIds,
  onToggle,
}: LoyaltyFilterPillSectionProps<T>) {
  return (
    <View className="gap-2.5">
      <Typography variant="text-14-bold" className="text-black">
        {title}
      </Typography>
      <Typography variant="text-12-regular" className="text-gray-600">
        {hint}
      </Typography>
      <View className="flex-row flex-wrap gap-2">
        {options.map((option) => (
          <SelectablePill
            key={option.id}
            label={option.label}
            selected={selectedIds.includes(option.id)}
            onPress={() => onToggle(option.id)}
          />
        ))}
      </View>
    </View>
  );
}
