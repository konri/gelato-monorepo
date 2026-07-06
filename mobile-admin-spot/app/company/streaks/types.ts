import type { StreakingPolicy } from "@/shared/api-client/src/graphql/queries/streaks";

export type StreakStageBenefitType =
  | "REWARD"
  | "INFO_ONLY"
  | "POINTS_MULTIPLIER"
  | "FIXED_POINTS";

export type StreakStageFormData = {
  dayThreshold: string;
  benefitType: StreakStageBenefitType;
  rewardId: string;
  pointsMultiplier: string;
  pointsAmount: string;
};

export type StreakProgramFormData = {
  name: string;
  description: string;
  stages: StreakStageFormData[];
  streakingPolicy: StreakingPolicy;
  streakingInterval: string;
  timezone: string;
  graceDays: string;
  repeatable: boolean;
  isActive: boolean;
};

export type TranslationFn = (key: string, options?: Record<string, unknown>) => string;

export type ProgramStageInput = {
  dayThreshold?: number | null;
  benefitType?: StreakStageBenefitType | null;
  rewardId?: string | null;
  pointsMultiplier?: number | null;
  pointsAmount?: number | null;
  reward?: {
    id?: string | null;
    title?: string | null;
  } | null;
};

export type ProgramInput = {
  name?: string | null;
  description?: string | null;
  stages?: ProgramStageInput[] | null;
  streakingPolicy?: StreakProgramFormData["streakingPolicy"] | null;
  timezone?: string | null;
  streakingInterval?: number | null;
  graceDays?: number | null;
  repeatable?: boolean | null;
  isActive?: boolean | null;
  requiredConsecutiveDays?: number | null;
  rewardId?: string | null;
};

export type StagePayload = {
  dayThreshold: number;
  benefitType: StreakStageBenefitType;
  rewardId?: string;
  pointsMultiplier?: number;
  pointsAmount?: number;
  infoMessage?: string;
};
