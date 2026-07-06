export type StreakProgramReward = {
  id: string;
  title: string;
};

export type StreakingPolicy = "DAILY" | "WEEKLY" | "MONTHLY";

export type StreakProgramStage = {
  id: string;
  dayThreshold: number;
  benefitType: "REWARD" | "INFO_ONLY" | "POINTS_MULTIPLIER" | "FIXED_POINTS";
  rewardId?: string | null;
  infoMessage?: string | null;
  pointsMultiplier?: number | null;
  pointsAmount?: number | null;
  reward?: StreakProgramReward | null;
};

export type StreakProgram = {
  id: string;
  merchantId: string;
  rewardId?: string | null;
  name: string;
  description?: string | null;
  requiredConsecutiveDays: number;
  streakingPolicy: StreakingPolicy;
  streakingInterval: number;
  timezone?: string | null;
  graceDays: number;
  repeatable: boolean;
  isActive: boolean;
  availableStoreIds?: string[];
  createdAt: string;
  updatedAt: string;
  reward?: StreakProgramReward | null;
  stages: StreakProgramStage[];
};

export type UserStreakStatus = {
  currentStreak: number;
  longestStreak: number;
  claimableRewardsCount: number;
  claimedCycles: number;
  requiredConsecutiveDays: number;
  remainingDaysToReward: number;
  lastVisitLocalDate?: string | null;
  streakProgram: StreakProgram;
};

export type GetMyStreakProgramsResponse = {
  myMerchantStreaks: StreakProgram[];
};

export type GetMyStreakProgramsVariables = {
  storeId?: string;
};

export type GetMyStreakStatusResponse = {
  myStreakStatus: UserStreakStatus;
};

export type GetMyStreakStatusVariables = {
  streakProgramId: string;
};

