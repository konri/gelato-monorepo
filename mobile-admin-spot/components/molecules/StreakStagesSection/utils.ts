import type {
  ProgramStageInput,
  StreakStageOption,
  TranslationFn,
} from "./types";

export const buildStageRewardTitlesById = (
  programStages: readonly ProgramStageInput[],
): Map<string, string> =>
  new Map(
    programStages.flatMap((stage) => {
      const rewardId = stage.rewardId ?? stage.reward?.id;
      const rewardTitle = stage.reward?.title;
      if (!rewardId || !rewardTitle) {
        return [];
      }
      return [[rewardId, rewardTitle] as const];
    }),
  );

export const getBenefitTypeOptions = (
  t: TranslationFn,
  allowPointsBenefits: boolean,
  selectedBenefitType?: string,
): StreakStageOption[] => {
  const baseOptions: StreakStageOption[] = [
    { label: t("Streak.stageBenefitTypeReward"), value: "REWARD" },
    { label: t("Streak.stageBenefitTypeNoReward"), value: "INFO_ONLY" },
  ];
  const isSelectedPointsType =
    selectedBenefitType === "POINTS_MULTIPLIER" ||
    selectedBenefitType === "FIXED_POINTS";

  if (!allowPointsBenefits && !isSelectedPointsType) {
    return baseOptions;
  }

  return [
    { label: t("Streak.stageBenefitTypeReward"), value: "REWARD" },
    { label: t("Streak.stageBenefitTypePointsMultiplier"), value: "POINTS_MULTIPLIER" },
    { label: t("Streak.stageBenefitTypeFixedPoints"), value: "FIXED_POINTS" },
    { label: t("Streak.stageBenefitTypeNoReward"), value: "INFO_ONLY" },
  ];
};
