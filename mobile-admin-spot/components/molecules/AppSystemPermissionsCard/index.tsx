import { SettingsNavSection } from "@/components/molecules/SettingsNavSection";
import React from "react";
import { useTranslation } from "react-i18next";
import type { AppSystemPermissionsCardProps } from "./types";

export const AppSystemPermissionsCard = ({
  cameraLabel,
  locationLabel,
  onPressCameraPermission,
  onPressLocationPermission,
  onOpenOsSettings,
}: AppSystemPermissionsCardProps) => {
  const { t } = useTranslation();
  return (
    <SettingsNavSection
      title="AppSystemPermissionsCard"
      hideHeading
      items={[
        {
          title: t("AccountHub.permissionCamera"),
          trailingLabel: cameraLabel ?? "—",
          onPress: onPressCameraPermission,
        },
        {
          title: t("AccountHub.permissionLocation"),
          trailingLabel: locationLabel ?? "—",
          onPress: onPressLocationPermission,
        },
        {
          title: t("AccountHub.openOsSettings"),
          onPress: onOpenOsSettings,
        },
      ]}
    />
  );
};
