import { Typography } from "@/components/atoms/Typography";
import React from "react";
import { View } from "react-native";
import type { SettingsSectionHeadingProps } from "./types";

export const SettingsSectionHeading = ({
  title,
  className = "",
}: SettingsSectionHeadingProps) => (
  <View className={`px-1 mb-2 mt-6 first:mt-2 ${className}`}>
    <Typography
      variant="text-16-bold"
      className="text-dark"
    >
      {title}
    </Typography>
  </View>
);
