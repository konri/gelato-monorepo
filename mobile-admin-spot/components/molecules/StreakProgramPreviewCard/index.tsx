import { Typography } from "@/components/atoms/Typography";
import { StreakMilestoneProgressBar } from "@/components/molecules/StreakMilestoneProgressBar";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import type { StreakProgramCardProps } from "./types";

export const StreakProgramCard = ({
  previewStreak,
  lastStageThreshold,
  streakingPolicy,
  safeStreakingInterval,
  progressPercentage,
  milestones,
  hasHiddenStart,
  hasMore,
  nextMilestone,
  stepsLeft,
}: StreakProgramCardProps) => {
  const { t } = useTranslation();
  const intervalLabel = t(`Streak.previewInterval${streakingPolicy}`, {
    count: safeStreakingInterval,
  });

  return (
    <>
      <View className="flex-row justify-between items-center">
        <View className="rounded-full border-2 border-orange-450 overflow-hidden">
          <LinearGradient
            colors={["#FFD740", "#FF8C00", "#FF5A20"]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
          >
            <View className="px-3 py-0.5">
              <Typography variant="text-14-bold-spaced" className="text-white">
                {t("Streak.previewStreakBadge", {
                  count: previewStreak,
                  intervalLabel,
                })}
              </Typography>
            </View>
          </LinearGradient>
        </View>
        <View className="bg-red-500 rounded-full-pill px-3 py-0.5">
          <Typography variant="text-14-bold-spaced" className="text-white">
            {previewStreak}/{lastStageThreshold}
          </Typography>
        </View>
      </View>

      <StreakMilestoneProgressBar
        progressPercentage={progressPercentage}
        milestones={milestones}
        showLeftFade={hasHiddenStart}
        showRightFade={hasMore}
        inactiveMilestoneBorderStyle="dashed"
      />

      <View className="bg-red-50 rounded-xl px-3 py-1.5">
        {nextMilestone ? (
          <Typography variant="text-12-semibold" className="text-gray-700">
            {t("Streak.previewNextReward", {
              stepsLabel: t("Streak.previewStreakSteps", { count: stepsLeft }),
              intervalLabel,
              reward: nextMilestone.rewardLabel,
            })}
          </Typography>
        ) : (
          <Typography variant="text-12-semibold" className="text-red-500 text-center">
            {t("Streak.previewAllRewardsClaimed")}
          </Typography>
        )}
      </View>
    </>
  );
};
