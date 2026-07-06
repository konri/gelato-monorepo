import { Button } from "@/components/atoms/Button";
import { AccountYourAccountCard } from "@/components/molecules/AccountYourAccountCard";
import { ConfirmModal } from "@/components/molecules/ConfirmModal";
import { ProfileTabScreenShell } from "@/components/molecules/ProfileTabScreenShell";
import { SettingsNavSection } from "@/components/molecules/SettingsNavSection";
import { SettingsSectionHeading } from "@/components/molecules/SettingsSectionHeading";
import { SubscriptionSummaryCard } from "@/components/molecules/SubscriptionSummaryCard";
import { SupportSectionContent } from "@/components/molecules/SupportSectionContent";
import { EXTERNAL_LINKS, SUPPORT_EMAIL } from "@/constants/externalLinks";
import { useWhoAmI } from "@/hooks/graphql/queries/useWhoAmI";
import { useProfileHubUserDisplay } from "@/hooks/useProfileHubUserDisplay";
import { useTabBarScrollBottomInset } from "@/hooks/useTabBarInset";
import { useAuth } from "@/hooks/useAuth";
import { showBackendPendingAlert } from "@/utils/accountHubAlerts";
import { logger } from "@/utils/logger";
import { navigateProfileWebContent } from "@/utils/navigateProfileWebContent";
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import * as Linking from "expo-linking";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, View } from "react-native";

export default function ProfileHubScreen() {
  const { t } = useTranslation();
  const scrollBottomInset = useTabBarScrollBottomInset();
  const { logout } = useAuth();
  const { data: whoData } = useWhoAmI();
  const { givenName, handleLabel } = useProfileHubUserDisplay(whoData?.whoAmI);
  const isOwner = useMemo(() => {
    const roles = whoData?.whoAmI?.roles ?? [];
    return roles.some((r) => r.trim().toUpperCase() === "OWNER");
  }, [whoData?.whoAmI?.roles]);

  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleConfirmLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      router.replace("/welcome");
    } catch {
      setIsLoggingOut(false);
    }
  };

  const version =
    Constants.expoConfig?.version ??
    (typeof Constants.nativeAppVersion === "string"
      ? Constants.nativeAppVersion
      : undefined) ??
    "—";

  return (
    <ProfileTabScreenShell showBackButton={false}>
      <ScrollView
        className="flex-1 bg-gray-50-light"
        contentContainerClassName="flex-grow-1 px-6 py-4 gap-4"
        contentContainerStyle={{ paddingBottom: scrollBottomInset }}
        showsVerticalScrollIndicator={false}
      >
        <AccountYourAccountCard
          givenName={givenName}
          handleLabel={handleLabel}
          pictureUri={whoData?.whoAmI?.picture}
          onPressEdit={() => router.push("/profile/edit-profile")}
        />

        <View className="items-center py-2">
          <View
            className="bg-row-divider"
            style={{ width: 210, height: 1 }}
          />
        </View>

        {isOwner ? (
          <>
            <SettingsSectionHeading
              title={t("AccountHub.subscriptionTitle")}
              className="mt-0"
            />
            <SubscriptionSummaryCard
              planName="Enterprise Premium"
              isActive
              renewalDate="12.10.2024"
              paymentMethodLast4="4242"
              lastInvoiceName="INV-2024-09.pdf"
              onChangePlan={() =>
                showBackendPendingAlert(t, "AccountHub.subscriptionChangeHint")
              }
              onCancelSubscription={() =>
                showBackendPendingAlert(t, "AccountHub.subscriptionCancelHint")
              }
              onDownloadInvoice={() =>
                showBackendPendingAlert(t, "AccountHub.subscriptionInvoicesHint")
              }
            />
          </>
        ) : null}

        <SettingsNavSection
          title={t("AccountHub.sectionSecurity")}
          items={[
            {
              title: t("AccountHub.hubChangePassword"),
              leftIcon: <Ionicons name="lock-closed" size={13} color="#00387E" />,
              onPress: () => router.push("/profile/change-password"),
            },
            {
              title: t("AccountHub.securitySessions"),
              leftIcon: <Ionicons name="shield" size={13} color="#00387E" />,
              onPress: () =>
                showBackendPendingAlert(t, "AccountHub.securitySessionsHint"),
            },
            {
              title: t("AccountHub.hubRecentLogins"),
              leftIcon: <Ionicons name="time" size={15} color="#00387E" />,
              onPress: () =>
                showBackendPendingAlert(t, "AccountHub.securityLoginLogHint"),
            },
            {
              title: t("AccountHub.hubDeleteAccount"),
              leftIcon: <Ionicons name="trash" size={13} color="#D24848" />,
              variant: "danger",
              onPress: () =>
                showBackendPendingAlert(t, "AccountHub.securityDeleteHint"),
            },
          ]}
        />

        <SettingsNavSection
          title={t("AccountHub.sectionSettings")}
          items={[
            {
              title: t("AccountHub.languageHeading"),
              leftIcon: <Ionicons name="globe" size={12} color="#00387E" />,
              onPress: () => router.push("/profile/app-preferences"),
            },
            {
              title: t("AccountHub.settingsNotifications"),
              leftIcon: <Ionicons name="notifications" size={15} color="#00387E" />,
              onPress: () => router.push("/profile/notifications"),
            },
            {
              title: t("AccountHub.systemPermissionsHeading"),
              leftIcon: (
                <Ionicons name="phone-portrait-outline" size={13} color="#00387E" />
              ),
              onPress: () => router.push("/profile/access-permissions"),
            },
          ]}
        />

        <SettingsNavSection
          title={t("AccountHub.sectionAccess")}
          items={[
            {
              title: t("AccountHub.settingsAccess"),
              leftIcon: <Ionicons name="key" size={13} color="#00387E" />,
              onPress: () => router.push("/profile/granted-app-access"),
            },
          ]}
        />

        <SettingsNavSection
          title={t("AccountHub.sectionAppSettings")}
          items={[
            {
              title: t("AccountHub.appTerms"),
              onPress: () =>
                navigateProfileWebContent(
                  EXTERNAL_LINKS.platformTerms,
                  t("AccountHub.appTerms"),
                ),
            },
            {
              title: t("AccountHub.legalPrivacy"),
              onPress: () =>
                navigateProfileWebContent(
                  EXTERNAL_LINKS.privacyPolicy,
                  t("AccountHub.legalPrivacy"),
                ),
            },
            {
              title: t("AccountHub.legalGdpr"),
              onPress: () =>
                navigateProfileWebContent(
                  EXTERNAL_LINKS.gdpr,
                  t("AccountHub.legalGdpr"),
                ),
            },
          ]}
        />

        <SettingsSectionHeading title={t("AccountHub.supportTitle")} />
        <SupportSectionContent
          version={`v. ${version}`}
          onHelpCenter={() =>
            navigateProfileWebContent(
              EXTERNAL_LINKS.helpCenter,
              t("AccountHub.helpCenter"),
            )
          }
          onContact={() => {
            Linking.openURL(`mailto:${SUPPORT_EMAIL}`).catch((e) =>
              logger.error("openMail", e),
            );
          }}
        />

        <View className="mt-2">
          <Button
            title={t("Common.logout") || "Wyloguj się"}
            onPress={() => setLogoutModalVisible(true)}
            variant="primary"
            size="md"
            width="100%"
          />
        </View>
      </ScrollView>
      <ConfirmModal
        visible={logoutModalVisible}
        onClose={() => setLogoutModalVisible(false)}
        onConfirm={() => void handleConfirmLogout()}
        title={t("Common.logout") || "Wyloguj się"}
        message={t("Common.logoutConfirm") || "Czy na pewno chcesz się wylogować?"}
        confirmText={t("Common.logout") || "Wyloguj"}
        cancelText={t("Common.cancel") || "Anuluj"}
        confirmVariant="danger"
        isLoading={isLoggingOut}
      />
    </ProfileTabScreenShell>
  );
}
