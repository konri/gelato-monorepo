import type { StreakMilestoneItem } from "@/components/molecules/StreakMilestoneProgressBar/types";
import type { StreakingPolicy } from "@/shared/api-client/src/graphql/queries/streaks";
import type { StreakPreviewStage } from "@/components/molecules/StreakProgramPreview/types";

export type StreakProgramCardProps = {
  previewStreak: number;
  lastStageThreshold: number;
  streakingPolicy: StreakingPolicy;
  safeStreakingInterval: number;
  progressPercentage: number;
  milestones: StreakMilestoneItem[];
  hasHiddenStart: boolean;
  hasMore: boolean;
  nextMilestone?: StreakPreviewStage;
  stepsLeft: number;
};
