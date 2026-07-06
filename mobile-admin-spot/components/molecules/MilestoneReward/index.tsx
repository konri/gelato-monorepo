import { Image } from "@/components/atoms/Image";
import { Typography } from "@/components/atoms/Typography";
import { Ionicons } from "@expo/vector-icons";
import type { ImageProps as ExpoImageProps } from "expo-image";
import React from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

type MilestoneRewardProps = {
    milestoneTitle: string;
    missingStamps: number;
    hasEnoughStamps: boolean;
    imageSource?: ExpoImageProps["source"] | null;
    previewImageUrl?: string;
    isEditMode?: boolean;
};

export const MilestoneReward = ({
    milestoneTitle,
    missingStamps,
    hasEnoughStamps,
    imageSource,
    previewImageUrl,
    isEditMode,
}: MilestoneRewardProps) => {
    const { t } = useTranslation();

    return (
        <View className="flex-row items-center gap-3 relative ml-8 ">
            <View className="absolute top-0 -left-8 w-14 h-14 rounded-full items-center justify-center overflow-hidden">
                {isEditMode && previewImageUrl ? (
                    <Image
                        key={previewImageUrl}
                        source={{ uri: previewImageUrl }}
                        className="h-14 w-14"
                        contentFit="cover"
                        fallbackLogoSize={18}
                    />
                ) : (
                    <Image
                        source={imageSource ?? { uri: previewImageUrl }}
                        fallbackLogoSize={18}
                        className="h-14 w-14"
                        contentFit="cover"
                    />
                )}
            </View>
            <View className="flex-row items-center">
                <View className="flex items-center">
                    <Typography
                        variant="text-14-bold-spaced"
                        className="text-grey-700"
                    >
                        {milestoneTitle}
                    </Typography>
                    {!hasEnoughStamps && (
                        <View className="bg-white border border-red-600-45 rounded-full px-2">
                            <Typography
                                variant="text-14-bold-spaced"
                                className="text-accent"
                            >
                                {t("Loyalty.milestoneMissingStamps", { count: missingStamps })}
                            </Typography>
                        </View>
                    )}
                    {hasEnoughStamps && (
                        <View className="flex-row items-center gap-1">
                            <View className="bg-white border border-accent rounded-full px-2">
                                <Typography
                                    variant="text-14-bold-spaced"
                                    className="text-accent"
                                >
                                    {t("Loyalty.milestoneRewardCta")}
                                </Typography>
                            </View>
                        </View>
                    )}
                </View>
                {hasEnoughStamps && (
                    <Ionicons name="chevron-forward" size={20} color="#EC2828" />
                )}
            </View>

        </View>
    );
};
