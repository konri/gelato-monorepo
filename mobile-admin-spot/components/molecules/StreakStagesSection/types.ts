import type { StreakStageBenefitType } from "@/app/company/streaks/types";

export type StageRewardInput = {
  id?: string | null;
  title?: string | null;
};

export type ProgramStageInput = {
  rewardId?: string | null;
  reward?: StageRewardInput | null;
};

export type StreakStagesSectionProps = {
  rewardTitlesById: Map<string, string>;
  allowPointsBenefits: boolean;
  onRewardTitleSelect: (rewardId: string, rewardTitle: string) => void;
  onCreateNewReward: () => void;
};

export type StreakStageOption = {
  label: string;
  value: StreakStageBenefitType;
};

export type TranslationFn = (key: string, options?: Record<string, unknown>) => string;
