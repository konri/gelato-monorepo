import { Typography } from "@/components/atoms/Typography";
import React from "react";
import { View } from "react-native";

import type { MerchantStatsQueryErrorCardProps } from "./types";

export const MerchantStatsQueryErrorCard = ({ message }: MerchantStatsQueryErrorCardProps) => {
  return (
    <View className="bg-red-50 border border-red-100 rounded-3xl p-4 shadow-settings-card">
      <Typography variant="text-14-semibold" className="text-red-800">
        {message}
      </Typography>
    </View>
  );
};
