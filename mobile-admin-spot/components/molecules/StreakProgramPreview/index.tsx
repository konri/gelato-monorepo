import { Slider } from "@/components/atoms/Slider";
import { StreakProgramCard } from "@/components/molecules/StreakProgramPreviewCard";
import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { PREVIEW_ICON_NAMES, VISIBLE_MILESTONES_COUNT } from "./constants";
import type { StreakPreviewStage, StreakProgramPreviewProps } from "./types";
import { getRewardLabel } from "./utils";
import { useStreakPreviewModel } from "./useStreakPreviewModel";

export const StreakProgramPreview = ({
  stages,
  rewardTitlesById,
  streakingPolicy,
  streakingInterval,
}: StreakProgramPreviewProps) => {
  const { t } = useTranslation();
  const [previewStreak, setPreviewStreak] = useState(0);
  const previewStages = useMemo<StreakPreviewStage[]>(
    () => {
      const uniqueStagesByThreshold = new Map<number, StreakPreviewStage>();

      stages.forEach((stage, index) => {
        const dayThreshold = Number(stage.dayThreshold);
        if (!Number.isFinite(dayThreshold) || dayThreshold < 1) {
          return;
        }

        if (uniqueStagesByThreshold.has(dayThreshold)) {
          return;
        }

        uniqueStagesByThreshold.set(dayThreshold, {
          id: `stage-${index}-${dayThreshold}`,
          dayThreshold,
          rewardLabel: getRewardLabel({ stage, index, rewardTitlesById, t }),
        });
      });

      return [...uniqueStagesByThreshold.values()].sort((a, b) => a.dayThreshold - b.dayThreshold);
    },
    [rewardTitlesById, stages, t],
  );

  const safeStreakingInterval = Math.max(1, streakingInterval);
  const shortUnitLabel =
    streakingPolicy === "WEEKLY"
      ? t("Streak.previewWeeksShort")
      : streakingPolicy === "MONTHLY"
        ? t("Streak.previewMonthsShort")
        : t("Streak.previewDaysShort");

  const {
    lastStageThreshold,
    progressPercentage,
    milestones,
    hasHiddenStart,
    hasMore,
    nextMilestone,
    stepsLeft,
  } = useStreakPreviewModel({
    stages: previewStages,
    previewStreak,
    shortUnitLabel,
    visibleMilestonesCount: VISIBLE_MILESTONES_COUNT,
    iconNames: PREVIEW_ICON_NAMES,
  });

  useEffect(() => {
    setPreviewStreak((current) => Math.min(current, lastStageThreshold));
  }, [lastStageThreshold]);

  return (
    <View className="gap-2">
      <StreakProgramCard
        previewStreak={previewStreak}
        lastStageThreshold={lastStageThreshold}
        streakingPolicy={streakingPolicy}
        safeStreakingInterval={safeStreakingInterval}
        progressPercentage={progressPercentage}
        milestones={milestones}
        hasHiddenStart={hasHiddenStart}
        hasMore={hasMore}
        nextMilestone={nextMilestone}
        stepsLeft={stepsLeft}
      />
      <Slider value={previewStreak} min={0} max={lastStageThreshold} onValueChange={setPreviewStreak} />
    </View>
  );
};
