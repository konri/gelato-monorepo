import type { StreakingPolicy } from "@/shared/api-client/src/graphql/queries/streaks";

export type StreakPreviewStage = {
  id: string;
  dayThreshold: number;
  rewardLabel: string;
};

export type StreakFormStageInput = {
  dayThreshold: string;
  benefitType: "REWARD" | "INFO_ONLY" | "POINTS_MULTIPLIER" | "FIXED_POINTS";
  rewardId: string;
  pointsMultiplier: string;
  pointsAmount: string;
};

export type StreakProgramPreviewProps = {
  stages: StreakFormStageInput[];
  rewardTitlesById: Map<string, string>;
  streakingPolicy: StreakingPolicy;
  streakingInterval: number;
};
