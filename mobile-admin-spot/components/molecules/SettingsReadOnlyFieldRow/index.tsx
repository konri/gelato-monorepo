import { Typography } from "@/components/atoms/Typography";
import React from "react";
import { View } from "react-native";
import type { SettingsReadOnlyFieldRowProps } from "./types";

export const SettingsReadOnlyFieldRow = (props: SettingsReadOnlyFieldRowProps) => {
  const { label, className = "" } = props;

  return (
    <View className={`px-4 py-3 ${className}`}>
      <Typography variant="text-14-semibold" className="text-gray-600">
        {label}
      </Typography>
      {"children" in props && props.children ? (
        <View className="mt-2">{props.children}</View>
      ) : (
        <Typography
          variant="text-16-regular"
          className={`mt-1 font-normal ${
            "valueTone" in props && props.valueTone === "muted"
              ? "text-gray-600"
              : "text-gray-900"
          }`}
        >
          {"value" in props ? props.value : ""}
        </Typography>
      )}
    </View>
  );
};
