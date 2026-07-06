import { Typography } from "@/components/atoms/Typography";
import { shadows } from "@/constants/shadows";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";
import { twMerge } from "tailwind-merge";

import type { FiltersPillTriggerProps } from "./types";

export const FiltersPillTrigger = ({
  onPress,
  activeFilterCount,
  labelKey,
  denseHeader,
  capBadgeAt99,
}: FiltersPillTriggerProps) => {
  const { t } = useTranslation();

  const badgeText =
    capBadgeAt99 && activeFilterCount > 99 ? "99+" : String(activeFilterCount);

  return (
    <Pressable
      onPress={onPress}
      className={twMerge(
        "flex-row items-center gap-2 rounded-full bg-white/50 px-3.5 py-2",
        denseHeader && "shrink-0 z-10",
      )}
      style={shadows.sm}
      {...(denseHeader
        ? { hitSlop: { top: 8, bottom: 8, left: 8, right: 8 } }
        : {})}
    >
      <Ionicons name="options-outline" size={18} color="#000000" />
      <Typography variant="text-14-semibold" className="text-black">
        {t(labelKey)}
      </Typography>
      {activeFilterCount > 0 ? (
        <View className="h-5 min-w-5 px-1 items-center justify-center rounded-full bg-red-500">
          <Typography variant="text-12-semibold" className="text-white">
            {badgeText}
          </Typography>
        </View>
      ) : null}
    </Pressable>
  );
};
