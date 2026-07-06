import { Typography } from "@/components/atoms/Typography";
import type { StreakProgramStage } from "@/shared/api-client/src/graphql/queries/streaks";
import { Ionicons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import type { StreakListProgramTimelineProps } from "./types";
import { streakStageBenefitIcon } from "./utils";

const buildDayToStage = (stages: StreakProgramStage[]) => {
  const map = new Map<number, StreakProgramStage>();
  for (const stage of stages) {
    const day = stage.dayThreshold;
    if (typeof day === "number" && Number.isFinite(day) && day > 0) {
      map.set(day, stage);
    }
  }
  return map;
};

export const StreakListProgramTimeline = ({
  programId,
  totalDays,
  stages,
  isProgramActive,
}: StreakListProgramTimelineProps) => {
  const { t } = useTranslation();
  const dayToStage = useMemo(() => buildDayToStage(stages), [stages]);

  return (
    <View className="gap-1.5">
      <Typography variant="text-12-regular" className="text-gray-500">
        {t("Streak.listTimelineCaption")}
      </Typography>
      <View className="flex-row flex-wrap gap-1.5">
        {Array.from({ length: totalDays }, (_, index) => {
          const day = index + 1;
          const stage = dayToStage.get(day);
          const hasMilestone = stage != null;
          return (
            <View
              key={`${programId}-timeline-day-${day}`}
              className={`w-10 min-h-[48px] rounded-xl border-2 px-1 items-center justify-center ${
                hasMilestone ? "gap-0.5 py-1" : "py-1.5"
              } ${
                hasMilestone
                  ? isProgramActive
                    ? "border-red-400 bg-red-50"
                    : "border-gray-400 bg-gray-200"
                  : isProgramActive
                    ? "border-gray-200 bg-gray-50"
                    : "border-gray-300 bg-gray-100"
              }`}
            >
              <Typography
                variant="text-12-bold"
                className={hasMilestone && isProgramActive ? "text-red-600" : "text-gray-600"}
              >
                {day}
              </Typography>
              {hasMilestone && stage ? (
                <Ionicons
                  name={streakStageBenefitIcon(stage.benefitType)}
                  size={14}
                  color={isProgramActive ? "#DC2626" : "#6B7280"}
                />
              ) : null}
            </View>
          );
        })}
      </View>
    </View>
  );
};
