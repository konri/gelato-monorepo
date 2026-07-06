import { Button } from "@/components/atoms/Button";
import { TextButton } from "@/components/atoms/TextButton";
import { AuthHeader } from "@/components/molecules/AuthHeader";
import { useNotifications } from "@/hooks/useNotifications";
import React from "react";
import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";

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
                <Text className="text-white text-xs font-bold">🍦</Text>
              </View>
            </View>

            <View className="flex-1">
              <Text
                className="text-lg font-bold text-gray-900 mb-1"
                style={{ fontFamily: "Urbanist" }}
              >
                {t("Notifications.cardTitle")}
              </Text>
              <Text
                className="text-sm text-gray-600 mb-1"
                style={{ fontFamily: "Urbanist" }}
              >
                {t("Notifications.cardSubtitle")}
              </Text>
              <Text
                className="text-sm text-gray-900 font-semibold"
                style={{ fontFamily: "Urbanist" }}
              >
                {t("Notifications.cardPromo")}
              </Text>
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
