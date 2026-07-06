import { Typography } from "@/components/atoms/Typography";
import { MilestoneReward } from "@/components/molecules/MilestoneReward";
import React from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { twMerge } from "tailwind-merge";
import type { MilestoneRewardSectionProps } from "./types";

export const MilestoneRewardSection = ({
    milestoneStampsRequired,
    milestoneTitle,
    filledStamps,
    isOnlyInFirstRow,
    hasRightRoundedTopCorner,
    hasRightRoundedBottomCorner,
}: MilestoneRewardSectionProps) => {
    const { t } = useTranslation();
    const missingStamps = Math.max(0, milestoneStampsRequired - filledStamps);
    const hasEnoughStamps = missingStamps === 0;

    const rewardSectionClassName = twMerge(
        "gap-2 bg-red-600-9 justify-center flex items-center border-x border-red-pale",
        isOnlyInFirstRow && "rounded-b-2xl border-b",
        hasRightRoundedTopCorner && "rounded-tr-2xl",
        hasRightRoundedBottomCorner && "rounded-br-2xl"
    );

    return (
        <View className={twMerge('pb-4', rewardSectionClassName)}>
            <Typography
                variant="text-14-bold-spaced"
                className="text-red-muted"
            >
                {t("Loyalty.milestoneRewardText", {
                    count: milestoneStampsRequired,
                    stamps: milestoneStampsRequired,
                    title: milestoneTitle,
                })}
            </Typography>
            <View className="flex-row items-center">
                <MilestoneReward
                    milestoneTitle={milestoneTitle}
                    missingStamps={missingStamps}
                    hasEnoughStamps={hasEnoughStamps}
                />
            </View>
        </View>
    );
};
