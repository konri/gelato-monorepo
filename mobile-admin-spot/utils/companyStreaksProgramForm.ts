import type { SelectOption } from "@/components/atoms/FormSelect/types";
import type {
  CreateStreakProgramInput,
  UpdateStreakProgramInput,
  UpsertStreakProgramStoreOverrideInput,
} from "@/shared/api-client/src/graphql/mutations/streak";
import {
  DEFAULT_STREAKING_INTERVAL,
  DEFAULT_STREAKING_POLICY,
  DEFAULT_STREAK_DAY_THRESHOLD,
  DEFAULT_TIMEZONE,
  DEFAULT_GRACE_DAYS,
  INITIAL_FORM_VALUES,
} from "@/app/company/streaks/constants";
import type {
  ProgramInput,
  ProgramStageInput,
  StagePayload,
  StreakProgramFormData,
  StreakStageBenefitType,
  StreakStageFormData,
  TranslationFn,
} from "@/app/company/streaks/types";

export const buildFormDefaultValues = (
  program?: ProgramInput,
): StreakProgramFormData => {
  if (!program) {
    return INITIAL_FORM_VALUES;
  }

  const programStages = program.stages ?? [];
  const lastStage =
    programStages.length > 0
      ? programStages.reduce((currentLast, stage) =>
          (stage.dayThreshold ?? 0) > (currentLast.dayThreshold ?? 0)
            ? stage
            : currentLast,
        )
      : undefined;

  const stages =
    programStages.length > 0
      ? programStages.map((stage) => toStageFormData(stage))
      : [
          {
            dayThreshold:
              lastStage?.dayThreshold?.toString() ??
              program.requiredConsecutiveDays?.toString() ??
              DEFAULT_STREAK_DAY_THRESHOLD,
            benefitType: lastStage?.benefitType ?? "INFO_ONLY",
            rewardId: lastStage?.rewardId ?? program.rewardId ?? "",
            pointsMultiplier:
              lastStage?.pointsMultiplier == null
                ? ""
                : lastStage.pointsMultiplier.toString(),
            pointsAmount:
              lastStage?.pointsAmount == null ? "" : lastStage.pointsAmount.toString(),
          },
        ];

  return {
    name: program.name ?? "",
    description: program.description ?? "",
    stages,
    streakingPolicy: program.streakingPolicy ?? DEFAULT_STREAKING_POLICY,
    timezone: DEFAULT_TIMEZONE,
    streakingInterval: program.streakingInterval?.toString() ?? DEFAULT_STREAKING_INTERVAL,
    graceDays: program.graceDays?.toString() ?? DEFAULT_GRACE_DAYS,
    repeatable: program.repeatable ?? false,
    isActive: program.isActive ?? true,
  };
};

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

export const getStreakingPolicyOptions = (
  t: TranslationFn,
): SelectOption<StreakProgramFormData["streakingPolicy"]>[] => [
  { label: t("Streak.streakingPolicyDAILY"), value: "DAILY" },
  { label: t("Streak.streakingPolicyWEEKLY"), value: "WEEKLY" },
  { label: t("Streak.streakingPolicyMONTHLY"), value: "MONTHLY" },
];

export const getBenefitTypeOptions = (
  t: TranslationFn,
): SelectOption<StreakStageBenefitType>[] => [
  { label: t("Streak.stageBenefitTypeReward"), value: "REWARD" },
  { label: t("Streak.stageBenefitTypePointsMultiplier"), value: "POINTS_MULTIPLIER" },
  { label: t("Streak.stageBenefitTypeFixedPoints"), value: "FIXED_POINTS" },
  { label: t("Streak.stageBenefitTypeNoReward"), value: "INFO_ONLY" },
];

export const buildStagesPayload = (
  stages: StreakStageFormData[],
  programName: string,
  t: TranslationFn,
): StagePayload[] =>
  stages
    .map((stage) => ({
      dayThreshold: Number(stage.dayThreshold),
      benefitType: stage.benefitType,
      rewardId: stage.benefitType === "REWARD" && stage.rewardId ? stage.rewardId : undefined,
      pointsMultiplier:
        stage.benefitType === "POINTS_MULTIPLIER"
          ? Number(stage.pointsMultiplier)
          : undefined,
      pointsAmount:
        stage.benefitType === "FIXED_POINTS" ? Number(stage.pointsAmount) : undefined,
      infoMessage:
        stage.benefitType === "INFO_ONLY"
          ? `${programName.trim() || t("Streak.defaultInfoMessageTitle")} — ${t("Streak.dayThresholdMessage", { count: Number(stage.dayThreshold) })}`
          : undefined,
    }))
    .sort((a, b) => a.dayThreshold - b.dayThreshold);

const toStageFormData = (stage: ProgramStageInput): StreakStageFormData => ({
  dayThreshold: (stage.dayThreshold ?? 1).toString(),
  benefitType: stage.benefitType ?? "INFO_ONLY",
  rewardId: stage.rewardId ?? "",
  pointsMultiplier: stage.pointsMultiplier == null ? "" : stage.pointsMultiplier.toString(),
  pointsAmount: stage.pointsAmount == null ? "" : stage.pointsAmount.toString(),
});

const buildCommonPayload = (data: StreakProgramFormData) => ({
  name: data.name.trim(),
  description: data.description.trim() || undefined,
  streakingInterval: Number(data.streakingInterval),
  timezone: DEFAULT_TIMEZONE,
  graceDays: Number(data.graceDays),
  repeatable: data.repeatable,
  isActive: data.isActive,
});

export const buildStreakOverrideInput = (
  data: StreakProgramFormData,
  programRequiredConsecutiveDays?: number | null,
): UpsertStreakProgramStoreOverrideInput => {
  const maxDayThreshold = Math.max(
    0,
    ...data.stages
      .map((stage) => Number(stage.dayThreshold))
      .filter((n) => Number.isFinite(n) && n > 0),
  );
  return {
    ...buildCommonPayload(data),
    requiredConsecutiveDays: programRequiredConsecutiveDays ?? Math.max(1, maxDayThreshold),
  };
};

export const buildCreateStreakInput = (
  merchantId: string,
  data: StreakProgramFormData,
  stages: StagePayload[],
): CreateStreakProgramInput => ({
  merchantId,
  ...buildCommonPayload(data),
  streakingPolicy: data.streakingPolicy,
  stages,
});

export const buildUpdateStreakInput = (
  data: StreakProgramFormData,
  stages: StagePayload[],
  shouldUpdateStages: boolean,
): UpdateStreakProgramInput => ({
  ...buildCommonPayload(data),
  streakingPolicy: data.streakingPolicy,
  ...(shouldUpdateStages ? { stages } : {}),
});
