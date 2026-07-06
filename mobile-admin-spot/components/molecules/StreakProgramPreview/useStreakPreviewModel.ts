import { useMemo } from "react";
import type { StreakMilestoneItem } from "@/components/molecules/StreakMilestoneProgressBar/types";
import type { StreakPreviewStage } from "./types";
import { getSafeDayThreshold } from "./utils";

type UseStreakPreviewModelParams = {
  stages: StreakPreviewStage[];
  previewStreak: number;
  shortUnitLabel: string;
  visibleMilestonesCount: number;
  iconNames: StreakMilestoneItem["iconName"][];
};

export const useStreakPreviewModel = ({
  stages,
  previewStreak,
  shortUnitLabel,
  visibleMilestonesCount,
  iconNames,
}: UseStreakPreviewModelParams) => {
  return useMemo(() => {
    const normalizedStages = stages.map((stage) => ({
      ...stage,
      dayThreshold: getSafeDayThreshold(stage.dayThreshold),
    }));

    const lastStageThreshold =
      normalizedStages[normalizedStages.length - 1]?.dayThreshold ?? 1;
    const achievedRewardsCount = normalizedStages.filter(
      (stage) => stage.dayThreshold <= previewStreak,
    ).length;

    const maxWindowStart = Math.max(0, normalizedStages.length - visibleMilestonesCount);
    const windowStart = Math.min(achievedRewardsCount, maxWindowStart);
    const visibleStages = normalizedStages.slice(
      windowStart,
      windowStart + visibleMilestonesCount,
    );
    const hasHiddenStart = windowStart > 0;
    const hasMore = windowStart + visibleMilestonesCount < normalizedStages.length;

    const trackStart = windowStart > 0 ? normalizedStages[windowStart - 1].dayThreshold : 0;
    const trackEnd =
      visibleStages[visibleStages.length - 1]?.dayThreshold ?? lastStageThreshold;
    const trackRange = Math.max(1, trackEnd - trackStart);
    const clampedStreak = Math.max(trackStart, Math.min(previewStreak, trackEnd));
    const progressPercentage = ((clampedStreak - trackStart) / trackRange) * 100;

    const milestones = visibleStages.map((stage, index) => ({
      id: stage.id,
      label: `${stage.dayThreshold} ${shortUnitLabel}`,
      positionPercent: ((stage.dayThreshold - trackStart) / trackRange) * 100,
      achieved: previewStreak >= stage.dayThreshold,
      iconName: iconNames[(windowStart + index) % iconNames.length],
    }));

    const nextMilestone = normalizedStages.find(
      (stage) => stage.dayThreshold > previewStreak,
    );
    const stepsLeft = nextMilestone ? nextMilestone.dayThreshold - previewStreak : 0;

    return {
      lastStageThreshold,
      progressPercentage,
      milestones,
      hasHiddenStart,
      hasMore,
      nextMilestone,
      stepsLeft,
    };
  }, [iconNames, previewStreak, shortUnitLabel, stages, visibleMilestonesCount]);
};
