import { Button } from "@/components/atoms/Button";
import { Typography } from "@/components/atoms/Typography";
import React from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, View } from "react-native";

type LoadingErrorStatesProps = {
    isLoading: boolean;
    hasError: boolean;
    onClose: () => void;
};

export const LoadingErrorStates = ({ isLoading, hasError, onClose }: LoadingErrorStatesProps) => {
    const { t } = useTranslation();

    if (hasError) {
        return (
            <View className="flex-1 items-center justify-center py-8 gap-4">
                <Typography variant="text-16-bold" className="text-red-500 text-center">
                    {t("Rewards.userNotFound")}
                </Typography>
                <Typography variant="text-14-regular-spaced" className="text-gray-600 text-center px-4">
                    {t("Rewards.userNotFoundDescription")}
                </Typography>
                <Button
                    title={t("Common.close")}
                    onPress={onClose}
                    variant="secondary"
                    size="md"
                />
            </View>
        );
    }

    if (isLoading) {
        return (
            <View className="flex-1 items-center justify-center py-8">
                <ActivityIndicator size="large" color="#EC2828" />
                <Typography variant="text-16-regular" className="text-gray-600 mt-4">
                    {t("Common.loading")}
                </Typography>
            </View>
        );
    }

    return null;
};
