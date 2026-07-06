import { ContextSwitcher } from "@/components/molecules/ContextSwitcher";
import { DashboardMenuItem } from "@/components/molecules/DashboardMenuItem";
import { InfoBanner } from "@/components/molecules/InfoBanner";
import { MerchantProfileHeader } from "@/components/organisms/MerchantProfileHeader";
import { OnboardingPrompt } from "@/components/organisms/OnboardingPrompt";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useTabBarScrollBottomInset } from "@/hooks/useTabBarInset";
import { useDashboardMenuItems } from "@/hooks/useDashboardMenuItems";
import { usePendingInvitation } from "@/hooks/usePendingInvitation";
import { router } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  View,
} from "react-native";

export default function MainScreen() {
  const { t } = useTranslation();
  const {
    isReady: isInvitationReady,
    hasPendingInvitation,
    token: invitationToken,
  } = usePendingInvitation();
  const {
    isLoading,
    isAdmin,
    canAccessCompanyWorkspace,
    featureAccess,
    merchantHeader,
    counts,
    firstStampTemplateId,
    hasPointsProgram,
    showLoyaltyConfigBanner,
    refreshing,
    onRefresh,
  } = useDashboardData();
  const menuItems = useDashboardMenuItems({
    isAdmin,
    featureAccess,
    counts,
    firstStampTemplateId,
    hasPointsProgram,
  });
  const scrollBottomInset = useTabBarScrollBottomInset();

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#EC2828" />
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-gray-50-light"
      contentContainerClassName="flex-grow-1"
      contentContainerStyle={{ paddingBottom: scrollBottomInset }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View className="px-6 pb-0 gap-4">
        {isInvitationReady && hasPendingInvitation && invitationToken && (
          <InfoBanner
            text={t("Cooperators.pendingInvitationBanner")}
            action={{
              label: t("Cooperators.openInvitation"),
              onPress: () =>
                router.push(`/cooperator-invitation?token=${invitationToken}`),
            }}
          />
        )}
      </View>
      {canAccessCompanyWorkspace ? (
        <View className="px-6 pt-4 pb-4 gap-4">
          {showLoyaltyConfigBanner && (
            <InfoBanner
              text={`${t("Company.onboardingCompleteMessage")} ${t("Loyalty.configureAtLeastOne")}`}
              action={{
                label: t("Loyalty.createLoyaltyProgram"),
                onPress: () => router.push("/company/onboarding/loyalty-setup"),
              }}
            />
          )}

          <MerchantProfileHeader
            merchantName={merchantHeader.name}
            logoUri={merchantHeader.logoUri}
            coverUri={merchantHeader.coverUri}
          />
          <ContextSwitcher />

          <View className="pt-4 gap-4">
            {menuItems.map((item) => (
              <DashboardMenuItem
                key={item.key}
                label={item.label}
                count={item.count}
                onPress={item.onPress}
                disabled={item.disabled}
              />
            ))}
          </View>
        </View>
      ) : (
        <OnboardingPrompt className="px-6 pt-6 pb-4 gap-4 overflow-visible" />
      )}
    </ScrollView>
  );
}
