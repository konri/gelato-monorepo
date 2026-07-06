import { Typography } from "@/components/atoms/Typography";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, View } from "react-native";
import type { SettingsNavRowProps } from "./types";

export const SettingsNavRow = ({
  title,
  onPress,
  showDivider = true,
  leftIcon,
  trailingLabel,
  variant = "default",
}: SettingsNavRowProps) => {
  const titleColor = variant === "danger" ? "text-danger-red" : "text-black";

  return (
    <View>
      <Pressable
        onPress={onPress}
        className="flex-row items-center px-5 py-2 active:opacity-80"
        style={{ minHeight: 44 }}
      >
        {leftIcon ? (
          <View className="w-4 items-center justify-center mr-3">
            {leftIcon}
          </View>
        ) : null}
        <Typography
          variant="text-12-bold"
          className={`${titleColor} flex-1 shrink`}
          style={{ lineHeight: 28 }}
          numberOfLines={1}
        >
          {title}
        </Typography>
        {trailingLabel ? (
          <Typography
            variant="text-12-regular"
            className="text-cool-gray max-w-[45%] shrink-0 text-right mr-2"
            numberOfLines={1}
          >
            {trailingLabel}
          </Typography>
        ) : null}
        <Ionicons name="chevron-forward" size={11} color="#C3C8CE" />
      </Pressable>
      {showDivider ? <View className="h-px bg-gray-lighter" /> : null}
    </View>
  );
};
