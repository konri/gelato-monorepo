import { Typography } from "@/components/atoms/Typography";
import { GlassView, isLiquidGlassAvailable } from "expo-glass-effect";
import React from "react";
import { StyleSheet, Switch, View } from "react-native";
import type { LoyaltyListFilterStoreExclusiveSectionProps } from "./types";

const useGlass = isLiquidGlassAvailable();

const styles = StyleSheet.create({
  glassRow: {
    borderRadius: 12,
    overflow: "hidden",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
});

const RowBody = ({
  title,
  hint,
  value,
  onChange,
}: LoyaltyListFilterStoreExclusiveSectionProps) => (
  <View className="gap-2">
    <View className="flex-row items-center justify-between gap-3">
      <Typography variant="text-14-semibold" className="text-black shrink">
        {title}
      </Typography>
      <Switch
        accessibilityLabel={title}
        value={value}
        onValueChange={onChange}
        trackColor={{ false: "#d1d5db", true: "#93c5fd" }}
        thumbColor={value ? "#1d4ed8" : "#f3f4f6"}
      />
    </View>
    <Typography variant="text-12-regular" className="text-gray-600">
      {hint}
    </Typography>
  </View>
);

export const LoyaltyListFilterStoreExclusiveSection = (
  props: LoyaltyListFilterStoreExclusiveSectionProps,
) => {
  if (useGlass) {
    return (
      <GlassView style={styles.glassRow}>
        <RowBody {...props} />
      </GlassView>
    );
  }

  return (
    <View className="rounded-xl bg-gray-100 px-3.5 py-2.5">
      <RowBody {...props} />
    </View>
  );
};
