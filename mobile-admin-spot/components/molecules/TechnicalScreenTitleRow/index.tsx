import { Typography } from "@/components/atoms/Typography";
import React from "react";
import { View } from "react-native";
import type { TechnicalScreenTitleRowProps } from "./types";

export const TechnicalScreenTitleRow = ({
  title,
  rightAccessory,
}: TechnicalScreenTitleRowProps) => (
  <View className="flex-row justify-between items-center">
    <Typography variant="text-20-bold" className="text-black flex-1">
      {title}
    </Typography>
    {rightAccessory}
  </View>
);
