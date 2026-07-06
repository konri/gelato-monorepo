import { AppPushPermissionCard } from "@/components/molecules/AppPushPermissionCard";
import { ProfileStackScrollScreen } from "@/components/molecules/ProfileStackScrollScreen";
import { TechnicalScreenTitleRow } from "@/components/molecules/TechnicalScreenTitleRow";
import { useAppPreferencePermissions } from "@/hooks/useAppPreferencePermissions";
import React from "react";
import { useTranslation } from "react-i18next";

export default function NotificationsScreen() {
  const { t } = useTranslation();
  const { snapshot, onPressNotificationsPermission } = useAppPreferencePermissions();

  return (
    <ProfileStackScrollScreen>
      <TechnicalScreenTitleRow title={t("AccountHub.pushHeading")} />
      <AppPushPermissionCard
        notificationStatusLabel={snapshot?.notifications}
        onPressPermission={() => void onPressNotificationsPermission()}
      />
    </ProfileStackScrollScreen>
  );
}
