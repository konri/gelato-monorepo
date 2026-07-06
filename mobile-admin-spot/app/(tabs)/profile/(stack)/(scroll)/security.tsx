import { Typography } from "@/components/atoms/Typography";
import { ConfirmModal } from "@/components/molecules/ConfirmModal";
import { ProfileStackScrollScreen } from "@/components/molecules/ProfileStackScrollScreen";
import { SettingsNavSection } from "@/components/molecules/SettingsNavSection";
import { TechnicalScreenTitleRow } from "@/components/molecules/TechnicalScreenTitleRow";
import { useLogoutAllDevicesConfirm } from "@/hooks/useLogoutAllDevicesConfirm";
import { showBackendPendingAlert } from "@/utils/accountHubAlerts";
import { router } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

export default function SecurityScreen() {
  const { t } = useTranslation();
  const {
    isConfirmVisible,
    isSubmitting,
    openConfirm,
    closeConfirm,
    confirmLogoutAllDevices,
  } = useLogoutAllDevicesConfirm();

  return (
    <ProfileStackScrollScreen>
      <TechnicalScreenTitleRow title={t("AccountHub.securityTitle")} />
      <SettingsNavSection
        title={t("AccountHub.securityTitle")}
        hideHeading
        items={[
          {
            title: t("AccountHub.securityChangePassword"),
            onPress: () => router.push("/profile/change-password"),
          },
          {
            title: t("AccountHub.securitySessions"),
            onPress: () =>
              showBackendPendingAlert(t, "AccountHub.securitySessionsHint"),
          },
          {
            title: t("AccountHub.securityLoginLog"),
            onPress: () =>
              showBackendPendingAlert(t, "AccountHub.securityLoginLogHint"),
          },
          {
            title: t("AccountHub.securityDeleteAccount"),
            onPress: () =>
              showBackendPendingAlert(t, "AccountHub.securityDeleteHint"),
          },
          {
            title: t("AccountHub.securityLogoutAllDevices"),
            onPress: openConfirm,
          },
        ]}
      />
      <View>
        <Typography variant="text-14-regular-spaced" className="text-gray-600">
          {t("AccountHub.securityFootnote")}
        </Typography>
      </View>
      <ConfirmModal
        visible={isConfirmVisible}
        onClose={closeConfirm}
        onConfirm={() => void confirmLogoutAllDevices()}
        title={t("AccountHub.securityLogoutAllDevicesTitle")}
        message={t("AccountHub.securityLogoutAllDevicesMessage")}
        confirmText={t("AccountHub.securityLogoutAllDevicesConfirm")}
        cancelText={t("Common.cancel")}
        confirmVariant="danger"
        isLoading={isSubmitting}
      />
    </ProfileStackScrollScreen>
  );
}
