import { Slider } from "@/components/atoms/Slider";
import { Typography } from "@/components/atoms/Typography";
import React from "react";
import { useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

type MilestonesFormProps = {
    maxStamps?: number;
};

export const MilestonesForm = ({
    maxStamps,
}: MilestonesFormProps) => {
    const { t } = useTranslation();
    const form = useFormContext();


    const currentStampsRequired = form.watch("stampsRequired") ?? 0;
    const totalStamps =
        maxStamps && maxStamps > 0 ? maxStamps : currentStampsRequired || 8;

    const milestoneStampsRequired =
        form.watch("milestones.0.stampsRequired") || 1;

    const handleSliderValueChange = (value: number) => {
        form.setValue("milestones.0.stampsRequired", value, {
            shouldValidate: true,
            shouldDirty: true,
        });
    };

    return (
        <>
            <View className="gap-2">
                <Typography
                    variant="text-14-regular-spaced"
                    className="text-black"
                >
                    {t("Loyalty.intermediateRewardRequiredStampsLabel")}
                </Typography>
                <Slider
                    value={milestoneStampsRequired}
                    max={totalStamps}
                    min={1}
                    onValueChange={handleSliderValueChange}
                />
            </View>
        </>
    );
};
