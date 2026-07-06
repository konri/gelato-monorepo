import { AppSystemPermissionsCard } from "@/components/molecules/AppSystemPermissionsCard";
import { ProfileStackScrollScreen } from "@/components/molecules/ProfileStackScrollScreen";
import { TechnicalScreenTitleRow } from "@/components/molecules/TechnicalScreenTitleRow";
import { useAppPreferencePermissions } from "@/hooks/useAppPreferencePermissions";
import React from "react";
import { useTranslation } from "react-i18next";

export default function AccessPermissionsScreen() {
  const { t } = useTranslation();
  const {
    snapshot,
    openSystemSettings,
    onPressCameraPermission,
    onPressLocationPermission,
  } = useAppPreferencePermissions();

  return (
    <ProfileStackScrollScreen>
      <TechnicalScreenTitleRow title={t("AccountHub.systemPermissionsHeading")} />
      <AppSystemPermissionsCard
        cameraLabel={snapshot?.camera}
        locationLabel={snapshot?.location}
        onPressCameraPermission={() => void onPressCameraPermission()}
        onPressLocationPermission={() => void onPressLocationPermission()}
        onOpenOsSettings={openSystemSettings}
      />
    </ProfileStackScrollScreen>
  );
}
