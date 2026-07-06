import type { StreakStageFormData } from "@/app/company/streaks/types";

type ValidateDayThresholdInput = {
  value: string;
  stages: StreakStageFormData[];
  stageIndex: number;
  invalidDataMessage: string;
  duplicateMessage: string;
  lowerThanPreviousMessage: string;
};

export const validateDayThreshold = ({
  value,
  stages,
  stageIndex,
  invalidDataMessage,
  duplicateMessage,
  lowerThanPreviousMessage,
}: ValidateDayThresholdInput): true | string => {
  const normalizedValue = value.trim();
  if (!normalizedValue) {
    return true;
  }

  const numericValue = Number(normalizedValue);
  if (Number.isNaN(numericValue)) {
    return invalidDataMessage;
  }

  const duplicateCount = stages.filter(
    (stage) => Number(stage.dayThreshold) === numericValue,
  ).length;

  if (duplicateCount > 1) {
    return duplicateMessage;
  }

  if (stageIndex > 0) {
    const previousValue = stages[stageIndex - 1]?.dayThreshold?.trim();
    if (previousValue) {
      const previousNumericValue = Number(previousValue);
      if (!Number.isNaN(previousNumericValue) && numericValue < previousNumericValue) {
        return lowerThanPreviousMessage;
      }
    }
  }

  return true;
};

export const validateRequiredReward = (
  value: string,
  selectedBenefitType: StreakStageFormData["benefitType"],
  requiredMessage: string,
): true | string => {
  if (selectedBenefitType !== "REWARD") {
    return true;
  }
  return value ? true : requiredMessage;
};
