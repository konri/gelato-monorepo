import { Typography } from "@/components/atoms/Typography";
import { SettingsNavSection } from "@/components/molecules/SettingsNavSection";
import React from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import type { AppPushPermissionCardProps } from "./types";

export const AppPushPermissionCard = ({
  notificationStatusLabel,
  onPressPermission,
}: AppPushPermissionCardProps) => {
  const { t } = useTranslation();
  return (
    <SettingsNavSection
      title="AppPushPermissionCard"
      hideHeading
      items={[
        {
          title: notificationStatusLabel ?? "—",
          onPress: onPressPermission,
        },
      ]}
      cardFooter={
        <View className="px-5 py-3">
          <Typography variant="text-14-regular-spaced" className="text-cool-gray">
            {t("AccountHub.pushExplanation")}
          </Typography>
        </View>
      }
    />
  );
};
