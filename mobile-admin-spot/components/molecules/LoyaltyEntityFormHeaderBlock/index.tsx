import { Typography } from "@/components/atoms/Typography";
import { ContextSwitcher } from "@/components/molecules/ContextSwitcher";
import React from "react";
import { View } from "react-native";
import type { LoyaltyEntityFormHeaderBlockProps } from "./types";

export function LoyaltyEntityFormHeaderBlock({
  title,
  contextSwitcherTitle,
  headerActions,
  banner,
  containerClassName = "gap-4",
}: LoyaltyEntityFormHeaderBlockProps) {
  return (
    <View className={containerClassName}>
      <View className="flex-row justify-between items-center">
        <Typography variant="text-20-bold" className="text-black">
          {title}
        </Typography>
        {headerActions ?? null}
      </View>
      <ContextSwitcher title={contextSwitcherTitle} />
      {banner ?? null}
    </View>
  );
}
