import { Typography } from "@/components/atoms/Typography";
import React from "react";
import { View } from "react-native";

interface AuthHeaderProps {
  title: string;
  subtitle: string;
}

export const AuthHeader = ({ title, subtitle }: AuthHeaderProps) => (
  <View className="mb-2">
    <Typography variant="heading-32-bold" className="text-text-primary mb-2">
      {title}
    </Typography>
    <Typography variant="subtitle-light-spaced" className="text-text-subtitle">
      {subtitle}
    </Typography>
  </View>
);
