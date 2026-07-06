import { ProfileStackScrollScreen } from "@/components/molecules/ProfileStackScrollScreen";
import { SettingsNavSection } from "@/components/molecules/SettingsNavSection";
import { SettingsReadOnlySection } from "@/components/molecules/SettingsReadOnlySection";
import { SettingsSectionCard } from "@/components/molecules/SettingsSectionCard";
import { TechnicalScreenTitleRow } from "@/components/molecules/TechnicalScreenTitleRow";
import { useProfileSetupStatus } from "@/hooks/graphql/queries/useProfileSetupStatus";
import { useWhoAmI } from "@/hooks/graphql/queries/useWhoAmI";
import { showBackendPendingAlert } from "@/utils/accountHubAlerts";
import { router } from "expo-router";
import React, { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, View } from "react-native";

export default function SubscriptionScreen() {
  const { t } = useTranslation();
  const { data: whoData, loading: whoLoading } = useWhoAmI();
  const isOwner = useMemo(() => {
    const roles = whoData?.whoAmI?.roles ?? [];
    return roles.some((r) => r.trim().toUpperCase() === "OWNER");
  }, [whoData?.whoAmI?.roles]);

  useEffect(() => {
    if (whoLoading) {
      return;
    }
    if (!isOwner) {
      router.replace("/profile");
    }
  }, [whoLoading, isOwner]);

  const { data } = useProfileSetupStatus({ skip: !isOwner || whoLoading });

  const hasSubscription = data?.myProfileSetupStatus?.hasSubscription ?? false;

  if (whoLoading) {
    return (
      <ProfileStackScrollScreen>
        <View className="flex-1 items-center justify-center py-20">
          <ActivityIndicator size="large" color="#1A4196" />
        </View>
      </ProfileStackScrollScreen>
    );
  }

  if (!isOwner) {
    return null;
  }

  return (
    <ProfileStackScrollScreen>
      <TechnicalScreenTitleRow title={t("AccountHub.subscriptionTitle")} />
      <SettingsSectionCard>
        <SettingsReadOnlySection
          rows={[
            {
              id: "subscriptionStatus",
              label: t("AccountHub.subscriptionStatus"),
              value: hasSubscription
                ? t("AccountHub.subscriptionActive")
                : t("AccountHub.subscriptionInactive"),
            },
          ]}
        />
        <View className="h-px bg-gray-50-light mx-4" />
        <SettingsNavSection
          title={t("AccountHub.subscriptionTitle")}
          hideHeading
          wrapInCard={false}
          items={[
            {
              title: t("AccountHub.subscriptionCurrentPlan"),
              onPress: () =>
                showBackendPendingAlert(t, "AccountHub.subscriptionPlanHint"),
            },
            {
              title: t("AccountHub.subscriptionRenewal"),
              onPress: () =>
                showBackendPendingAlert(t, "AccountHub.subscriptionRenewalHint"),
            },
            {
              title: t("AccountHub.subscriptionPayment"),
              onPress: () =>
                showBackendPendingAlert(t, "AccountHub.subscriptionPaymentHint"),
            },
            {
              title: t("AccountHub.subscriptionInvoices"),
              onPress: () =>
                showBackendPendingAlert(t, "AccountHub.subscriptionInvoicesHint"),
            },
            {
              title: t("AccountHub.subscriptionChangePlan"),
              onPress: () =>
                showBackendPendingAlert(t, "AccountHub.subscriptionChangeHint"),
            },
            {
              title: t("AccountHub.subscriptionCancel"),
              onPress: () =>
                showBackendPendingAlert(t, "AccountHub.subscriptionCancelHint"),
            },
          ]}
        />
      </SettingsSectionCard>
    </ProfileStackScrollScreen>
  );
}
