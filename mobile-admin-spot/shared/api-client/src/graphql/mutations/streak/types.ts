import type {
  StreakingPolicy,
  StreakProgram,
  UserStreakStatus,
} from "../../queries/streaks";

export type CreateStreakProgramInput = {
  merchantId?: string;
  name: string;
  description?: string;
  streakingPolicy: StreakingPolicy;
  streakingInterval: number;
  timezone?: string;
  graceDays: number;
  repeatable: boolean;
  stages: CreateStreakStageInput[];
  isActive: boolean;
};

export type UpdateStreakProgramInput = {
  name?: string;
  description?: string;
  streakingPolicy?: StreakingPolicy;
  streakingInterval?: number;
  timezone?: string;
  graceDays?: number;
  repeatable?: boolean;
  stages?: CreateStreakStageInput[];
  isActive?: boolean;
};

export type CreateStreakStageInput = {
  dayThreshold: number;
  benefitType?: "REWARD" | "INFO_ONLY" | "POINTS_MULTIPLIER" | "FIXED_POINTS";
  rewardId?: string;
  infoMessage?: string;
  pointsMultiplier?: number;
  pointsAmount?: number;
};

export type RegisterStreakVisitInput = {
  streakProgramId: string;
  userId?: string;
  visitAt?: string;
  timezone?: string;
  source?: string;
  idempotencyKey?: string;
};

export type StreakRewardClaim = {
  id: string;
  userId: string;
  merchantId: string;
  streakProgramId: string;
  rewardId?: string | null;
  streakStageId?: string | null;
  cycleNumber: number;
  claimedAt: string;
  createdAt: string;
};

export type CreateStreakProgramResponse = {
  createStreakProgram: StreakProgram;
};

export type UpdateStreakProgramResponse = {
  updateStreakProgram: StreakProgram;
};

export type DeleteStreakProgramResponse = {
  deleteStreakProgram: boolean;
};

export type RegisterStreakVisitResponse = {
  registerStreakVisit: UserStreakStatus;
};

export type ClaimStreakRewardResponse = {
  claimStreakReward: StreakRewardClaim;
};

export type CreateStreakProgramVariables = {
  data: CreateStreakProgramInput;
  storeId?: string;
};

export type UpdateStreakProgramVariables = {
  streakProgramId: string;
  data: UpdateStreakProgramInput;
};

export type UpsertStreakProgramStoreOverrideInput = {
  name?: string;
  description?: string;
  requiredConsecutiveDays?: number;
  streakingInterval?: number;
  graceDays?: number;
  timezone?: string;
  repeatable?: boolean;
  isActive?: boolean;
};

export type UpsertStreakProgramStoreOverrideResponse = {
  upsertStreakProgramStoreOverride: StreakProgram;
};

export type UpsertStreakProgramStoreOverrideVariables = {
  streakProgramId: string;
  storeId: string;
  data: UpsertStreakProgramStoreOverrideInput;
};

export type DeleteStreakProgramVariables = {
  streakProgramId: string;
};

export type RegisterStreakVisitVariables = {
  data: RegisterStreakVisitInput;
};

export type ClaimStreakRewardVariables = {
  streakProgramId: string;
  userId?: string;
};

