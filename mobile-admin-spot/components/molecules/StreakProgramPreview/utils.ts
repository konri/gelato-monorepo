import type { TFunction } from "i18next";
import type { StreakFormStageInput } from "./types";

export const getSafeDayThreshold = (value: number) => {
  if (!Number.isFinite(value)) {
    return 1;
  }

  return Math.max(1, Math.round(value));
};

type GetRewardLabelParams = {
  stage: StreakFormStageInput;
  index: number;
  rewardTitlesById: Map<string, string>;
  t: TFunction;
};

export const getRewardLabel = ({ stage, index, rewardTitlesById, t }: GetRewardLabelParams) => {
  if (stage.benefitType === "REWARD") {
    const selectedRewardTitle = stage.rewardId ? rewardTitlesById.get(stage.rewardId) : undefined;
    return selectedRewardTitle || t("Streak.rewardFallback", { index: index + 1 });
  }

  if (stage.benefitType === "POINTS_MULTIPLIER") {
    const selectedMultiplier = Number(stage.pointsMultiplier);
    return Number.isFinite(selectedMultiplier) && selectedMultiplier > 0
      ? t("Streak.previewPointsMultiplier", { multiplier: selectedMultiplier })
      : t("Streak.previewPointsMultiplierFallback", { index: index + 1 });
  }

  if (stage.benefitType === "FIXED_POINTS") {
    const selectedPointsAmount = Number(stage.pointsAmount);
    return Number.isFinite(selectedPointsAmount) && selectedPointsAmount > 0
      ? t("Streak.previewFixedPoints", { points: selectedPointsAmount })
      : t("Streak.previewFixedPointsFallback", { index: index + 1 });
  }

  return t("Streak.noReward");
};
