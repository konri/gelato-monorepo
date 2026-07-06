import { Typography } from "@/components/atoms/Typography";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { View } from "react-native";
import { twMerge } from "tailwind-merge";
import { MilestoneMarker } from "./MilestoneMarker/index";
import type { StreakMilestoneProgressBarProps } from "./types";

type FadeOverlaySide = "left" | "right";

type FadeOverlayConfig = {
  colors: [string, string];
  start: { x: number; y: number };
  end: { x: number; y: number };
  className: string;
};

const FADE_OVERLAYS_BASE: Record<FadeOverlaySide, FadeOverlayConfig> = {
  left: {
    colors: ["#FFFFFF", "rgba(255,255,255,0)"],
    start: { x: 0, y: 0.5 },
    end: { x: 1, y: 0.5 },
    className: "left-0",
  },
  right: {
    colors: ["rgba(255,255,255,0)", "#FFFFFF"],
    start: { x: 0, y: 0.5 },
    end: { x: 1, y: 0.5 },
    className: "right-0",
  },
};

export const StreakMilestoneProgressBar = ({
  progressPercentage,
  milestones,
  showLeftFade = false,
  showRightFade = false,
  inactiveMilestoneBorderStyle = "solid",
  className,
  trackClassName,
  progressClassName,
}: StreakMilestoneProgressBarProps) => {
  const normalizedProgressPercentage = Math.max(0, Math.min(100, progressPercentage));
  return (
    <View className={twMerge("gap-2", className)}>
      <View className="relative">
        {showLeftFade && (
          <LinearGradient
            colors={["#FFFFFF", "rgba(255,255,255,0)"]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            pointerEvents="none"
            className="absolute left-0 top-0 bottom-0 w-8 z-10"
          />
        )}
        {showRightFade && (
          <LinearGradient
            colors={["rgba(255,255,255,0)", "#FFFFFF"]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            pointerEvents="none"
            className="absolute right-0 top-0 bottom-0 w-8 z-10"
          />
        )}
        <View className="pr-3.5">
          <View
            className={twMerge(
              "h-1.5 bg-gray-200 rounded-full overflow-visible my-2",
              trackClassName,
            )}
          >
            <View
              className={twMerge("h-1.5 bg-red-500 rounded-full", progressClassName)}
              style={{ width: `${normalizedProgressPercentage}%` }}
            />
            {milestones.map((milestone) => (
              <MilestoneMarker
                key={milestone.id}
                milestone={milestone}
                inactiveMilestoneBorderStyle={inactiveMilestoneBorderStyle}
              />
            ))}
          </View>
        </View>
      </View>
      <View className="relative h-4 px-3.5">
        {milestones.map((milestone) => (
          <View
            key={`label-${milestone.id}`}
            className="absolute -translate-x-1/2"
            style={{ left: `${milestone.positionPercent}%` }}
          >
            <Typography
              variant="text-10-medium"
              className={milestone.achieved ? "text-red-500" : "text-gray-400"}
            >
              {milestone.label}
            </Typography>
          </View>
        ))}
      </View>
    </View>
  );
};
