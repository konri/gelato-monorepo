import { MerchantStatsSessionOverlays } from "@/components/organisms/MerchantStatsSessionOverlays";
import { MerchantStatsSessionProvider } from "@/contexts/MerchantStatsSessionContext";
import { Stack } from "expo-router";
import React from "react";
import { View } from "react-native";

export default function CompanyStatsLayout() {
  return (
    <MerchantStatsSessionProvider>
      <View className="flex-1">
        <Stack screenOptions={{ headerShown: false }} />
        <MerchantStatsSessionOverlays />
      </View>
    </MerchantStatsSessionProvider>
  );
}
