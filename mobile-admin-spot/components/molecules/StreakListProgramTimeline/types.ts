import type { StreakProgramStage } from "@/shared/api-client/src/graphql/queries/streaks";

export type StreakListProgramTimelineProps = {
  programId: string;
  totalDays: number;
  stages: StreakProgramStage[];
  isProgramActive: boolean;
};
