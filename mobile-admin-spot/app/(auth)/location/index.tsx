import { Button } from "@/components/atoms/Button";
import { TextButton } from "@/components/atoms/TextButton";
import { Typography } from "@/components/atoms/Typography";
import { AuthHeader } from "@/components/molecules/AuthHeader";
import { useLocation } from "@/hooks/useLocation";
import React from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

export default function LocationScreen() {
  const { t } = useTranslation();
  const { isLoading, handleAllow, handleLater } = useLocation();

  return (
    <View className="flex-1 px-6 py-2">
      <View className="gap-8">
        <AuthHeader
          title={t("Location.title")}
          subtitle={t("Location.subtitle")}
        />

        <View className="bg-white rounded-32px p-6" style={{ minHeight: 300 }}>
          <View className="flex-1 bg-gray-100 rounded-24px items-center justify-center relative">
            <View className="absolute inset-0 bg-gray-100 rounded-24px" />

            <View className="absolute top-16 right-16">
              <View className="w-8 h-8 bg-red-500 rounded-full items-center justify-center">
                <View className="w-4 h-4 bg-white rounded-full" />
              </View>
            </View>

            <Typography variant="text-20-bold" className="text-gray-900 mt-8">
              {t("Location.cityName")}
            </Typography>
          </View>

          <View className="mt-6">
            <Typography
              variant="text-16-regular"
              className="text-center text-gray-600"
            >
              {t("Location.confirmText")}
            </Typography>
          </View>
        </View>

        <View className="gap-6">
          <View className="items-center">
            <Button
              title={isLoading ? t("Common.loading") : t("Location.allow")}
              onPress={handleAllow}
              variant="primary"
              disabled={isLoading}
              width="100%"
            />
          </View>

          <View className="items-center">
            <TextButton
              title={t("Location.later")}
              onPress={handleLater}
              variant="secondary"
            />
          </View>
        </View>
      </View>
    </View>
  );
}
