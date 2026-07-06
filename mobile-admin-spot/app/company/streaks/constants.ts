import type { StreakProgramFormData, StreakStageFormData } from "./types";

export const DEFAULT_STREAK_DAY_THRESHOLD = "3";
export const DEFAULT_STREAKING_POLICY = "DAILY";
export const DEFAULT_STREAKING_INTERVAL = "1";
export const DEFAULT_TIMEZONE = "Europe/Warsaw";
export const DEFAULT_GRACE_DAYS = "0";

export const EMPTY_STAGE: StreakStageFormData = {
  dayThreshold: "",
  benefitType: "INFO_ONLY",
  rewardId: "",
  pointsMultiplier: "",
  pointsAmount: "",
};

export const INITIAL_FORM_VALUES: StreakProgramFormData = {
  name: "",
  description: "",
  stages: [{ ...EMPTY_STAGE, dayThreshold: DEFAULT_STREAK_DAY_THRESHOLD }],
  streakingPolicy: DEFAULT_STREAKING_POLICY,
  streakingInterval: DEFAULT_STREAKING_INTERVAL,
  timezone: DEFAULT_TIMEZONE,
  graceDays: DEFAULT_GRACE_DAYS,
  repeatable: false,
  isActive: true,
};
