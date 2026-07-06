import { Typography } from "@/components/atoms/Typography";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, View } from "react-native";

import { DashboardMenuItemProps } from "./types";

export const DashboardMenuItem = ({
  label,
  count,
  badge,
  onPress,
  disabled = false,
  className = "",
}: DashboardMenuItemProps) => {
  const badgeText =
    typeof badge === "string" && badge.length > 0
      ? badge
      : typeof count === "number"
        ? String(count)
        : null;

  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      className={`bg-white rounded-2xl px-3 py-3 flex-row items-center justify-between ${
        disabled ? "opacity-50" : ""
      } ${className}`.trim()}
    >
      <Typography variant="text-12-bold">{label}</Typography>
      <View className="flex-row items-center gap-3">
        {badgeText !== null ? (
          <View className="w-6 h-6 rounded-full bg-blue-900 items-center justify-center">
            <Typography variant="text-12-bold" className="text-white">
              {badgeText}
            </Typography>
          </View>
        ) : null}
        <Ionicons name="chevron-forward" size={20} color="#000000" />
      </View>
    </Pressable>
  );
};
