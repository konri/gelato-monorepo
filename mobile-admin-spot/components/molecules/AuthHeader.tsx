import { Typography } from "@/components/atoms/Typography";
import React from "react";
import { View } from "react-native";

interface AuthHeaderProps {
  title: string;
  subtitle: string;
}

export const AuthHeader = ({ title, subtitle }: AuthHeaderProps) => (
  <View className="mb-2">
    <Typography variant="text-32-bold" className="text-gray-900 mb-2">
      {title}
    </Typography>
    <Typography variant="text-18-regular-spaced" className="text-gray-600">
      {subtitle}
    </Typography>
  </View>
);
