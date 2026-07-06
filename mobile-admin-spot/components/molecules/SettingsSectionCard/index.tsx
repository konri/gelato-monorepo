import React from "react";
import { View } from "react-native";
import type { SettingsSectionCardProps } from "./types";

export const SettingsSectionCard = ({
  children,
  className = "",
}: SettingsSectionCardProps) => (
  <View
    className={`bg-white rounded-3xl shadow-settings-card overflow-hidden ${className}`}
  >
    {children}
  </View>
);
