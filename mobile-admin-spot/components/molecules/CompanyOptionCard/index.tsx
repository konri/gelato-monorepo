import { Typography } from "@/components/atoms/Typography";
import { shadows } from "@/constants/shadows";
import React from "react";
import { Pressable, View } from "react-native";
import type { CompanyOptionCardProps } from "./types";

export const CompanyOptionCard = ({
  title,
  description,
  onPress,
  disabled = false,
}: CompanyOptionCardProps) => {
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      className="bg-white rounded-2xl flex-row items-start px-4 py-4 gap-3"
      style={shadows.sm}
    >
      <View
        className="w-9 h-9 rounded-full bg-gray-300"
        style={shadows.md}
      />

      <View className="flex-1 gap-0">
        <Typography variant="text-16-bold" className="text-black">
          {title}
        </Typography>
        <Typography variant="text-12-regular" className="text-black">
          {description}
        </Typography>
      </View>
    </Pressable>
  );
};
