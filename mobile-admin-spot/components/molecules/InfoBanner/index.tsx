import InfoIcon from "@/assets/images/info_icon.svg";
import { Button } from "@/components/atoms/Button";
import { Typography } from "@/components/atoms/Typography";
import React from "react";
import { View } from "react-native";

type InfoBannerAction = {
    label: string;
    onPress: () => void;
};

type InfoBannerProps = {
    text: string;
    showIcon?: boolean;
    action?: InfoBannerAction;
    variant?: "default" | "compact";
};

export const InfoBanner = ({
    text,
    showIcon = true,
    action,
    variant = "default",
}: InfoBannerProps) => {
    if (variant === "compact") {
        return (
            <View className="bg-blue-50 border border-blue-100 rounded-xl p-3">
                <Typography variant="text-12-regular" className="text-blue-900">
                    {text}
                </Typography>
            </View>
        );
    }

    return (
        <View className="bg-blue-200-gray rounded-2xl w-full p-3.5 gap-3">
            <View className="flex-row items-center gap-2.5">
                {showIcon && (
                    <View className="w-6 h-6 items-center justify-center">
                        <InfoIcon width={24} height={24} />
                    </View>
                )}
                <Typography
                    variant="text-16-regular-spaced-lineHeight-19.2"
                    className="flex-1 text-black"
                >
                    {text}
                </Typography>
            </View>
            {action && (
                <Button
                    title={action.label}
                    onPress={action.onPress}
                    variant="primary"
                    size="sm"
                />
            )}
        </View>
    );
};

