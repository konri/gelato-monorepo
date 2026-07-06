import { Typography } from "@/components/atoms/Typography";
import React from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

type PreviewFrameProps = {
    children: React.ReactNode;
};

export const PreviewFrame = ({ children }: PreviewFrameProps) => {
    const { t } = useTranslation();

    return (
        <View className="relative pt-2.5">
            <View className="bg-white border border-blue-900 rounded-2xl shadow-loyalty-card px-4 py-4 gap-5 shadow-sm">
                <View className="absolute inset-x-0 -top-2.5 items-center">
                    <View className="bg-blue-900 rounded-full-pill z-10 items-center justify-center py-1 px-3 h-6">
                        <Typography
                            variant="text-13-bold-spaced"
                            className="text-white text-center"
                        >
                            {t("Loyalty.preview")}
                        </Typography>
                    </View>
                </View>
                {children}
            </View>
        </View>
    );
};
