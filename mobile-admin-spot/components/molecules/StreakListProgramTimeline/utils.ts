import type { StreakProgramStage } from "@/shared/api-client/src/graphql/queries/streaks";
import type { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";

type IonName = ComponentProps<typeof Ionicons>["name"];

const BENEFIT_ICONS: Record<StreakProgramStage["benefitType"], IonName> = {
  REWARD: "gift-outline",
  INFO_ONLY: "information-circle-outline",
  POINTS_MULTIPLIER: "analytics-outline",
  FIXED_POINTS: "cash-outline",
};

export const streakStageBenefitIcon = (
  benefitType: StreakProgramStage["benefitType"],
): IonName => BENEFIT_ICONS[benefitType];
