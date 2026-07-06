import { Image } from "@/components/atoms/Image";
import { Typography } from "@/components/atoms/Typography";
import React from "react";
import { View } from "react-native";
import { twMerge } from "tailwind-merge";
import type { RewardCardProps } from "./types";

export const RewardCard = ({
  title,
  cost,
  stampsLabel,
  imageUrl,
  logoUrl,
  imageContent,
  containerClassName,
  valueSummary,
}: RewardCardProps) => {
  const badgeLabel =
    valueSummary && valueSummary.trim().length > 0
      ? valueSummary.trim()
      : `${cost} ${stampsLabel}`;
  return (
    <View
      className={twMerge(
        "bg-gray-lighter border border-gray-border-light rounded-reward p-3 items-center gap-2",
        containerClassName,
      )}
    >
      <View
        className={twMerge(
          "w-36 h-36 rounded-full bg-white items-center justify-center relative border border-gray-300",
          imageContent ? "overflow-visible" : "overflow-hidden",
        )}
      >
        {imageContent ?? (
          <Image
            uri={imageUrl}
            className="h-full w-full rounded-full"
            contentFit="cover"
            fallbackLogoSize={48}
          />
        )}
      </View>
      <View className="flex-col items-center gap-2">
        <Typography variant="text-14-bold" className="text-gray-700">
          {title}
        </Typography>
        <View className="bg-accent rounded-full-pill  px-4 pl-8 relative">
          <Typography variant="text-14-bold" className="text-white">
            {badgeLabel}
          </Typography>
          <View className="absolute -top-1.5 -left-3 w-8 h-8 z-10 rounded-full overflow-hidden">
            <Image uri={logoUrl} fallbackLogoSize={8} className="w-6 h-6" />
          </View>
        </View>
      </View>
    </View>
  );
};
