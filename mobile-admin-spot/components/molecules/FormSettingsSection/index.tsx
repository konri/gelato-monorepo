import { Typography } from "@/components/atoms/Typography";
import React from "react";
import { View } from "react-native";
import type { FormSettingsSectionProps } from "./types";

export function FormSettingsSection({
  title,
  description,
  leading,
  children,
}: FormSettingsSectionProps) {
  const showDescription =
    description !== undefined && description.length > 0;

  return (
    <View className="gap-4">
      <Typography variant="text-18-bold" className="text-black">
        {title}
      </Typography>
      <View className="gap-4">
        {leading}
        {showDescription ? (
          <Typography variant="text-12-regular" className="text-gray-600">
            {description}
          </Typography>
        ) : null}
        {children}
      </View>
    </View>
  );
}
