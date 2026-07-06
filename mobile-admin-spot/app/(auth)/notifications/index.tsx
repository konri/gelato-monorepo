import { Button } from "@/components/atoms/Button";
import { TextButton } from "@/components/atoms/TextButton";
import { Typography } from "@/components/atoms/Typography";
import { AuthHeader } from "@/components/molecules/AuthHeader";
import { useNotifications } from "@/hooks/useNotifications";
import React from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

export default function NotificationsScreen() {
  const { t } = useTranslation();
  const { isLoading, handleAllow, handleLater } = useNotifications();

  return (
    <View className="flex-1 px-6 py-2">
      <View className="gap-8">
        <AuthHeader
          title={t("Notifications.title")}
          subtitle={t("Notifications.subtitle")}
        />

        <View className="bg-white rounded-32px p-6">
          <View className="flex-row items-center">
            <View className="w-12 h-12 bg-orange-100 rounded-full items-center justify-center mr-4">
              <View className="w-8 h-8 bg-orange-400 rounded-full items-center justify-center">
                <Typography variant="text-12-regular" className="text-white">🥖</Typography>
              </View>
            </View>

            <View className="flex-1">
              <Typography variant="text-18-bold" className="text-gray-900 mb-1">
                {t("Notifications.cardTitle")}
              </Typography>
              <Typography variant="text-14-regular-spaced" className="text-gray-600 mb-1">
                {t("Notifications.cardSubtitle")}
              </Typography>
              <Typography variant="text-14-semibold" className="text-gray-900">
                {t("Notifications.cardPromo")}
              </Typography>
            </View>
          </View>
        </View>

        <View className="gap-6">
          <View className="items-center">
            <Button
              title={isLoading ? t("Common.loading") : t("Notifications.allow")}
              onPress={handleAllow}
              variant="primary"
              disabled={isLoading}
              width="100%"
            />
          </View>

          <View className="items-center">
            <TextButton
              title={t("Notifications.later")}
              onPress={handleLater}
              variant="secondary"
            />
          </View>
        </View>
      </View>
    </View>
  );
}
