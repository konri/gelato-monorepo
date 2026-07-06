import { GlobalProgressBar } from "@/components/atoms/GlobalProgressBar";
import { CustomSafeAreaView } from "@/components/CustomSafeAreaView";
import { HeaderWithBackButton } from "@/components/HeaderWithBackButton";
import { FEATURE_PERMISSIONS } from "@/constants/operatorPermissions";
import { useOnboardingStatus } from "@/hooks/useOnboardingStatus";
import { useOperatorAccess } from "@/hooks/useOperatorAccess";
import type { OperatorPermission } from "@/shared/api-client/src/graphql/types/operatorAccess";
import { router, Stack, useSegments } from "expo-router";
import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

const TOTAL_ONBOARDING_POINTS = 3;

export default function CompanyLayout() {
  const { t } = useTranslation();
  const { hasPermission, isAdmin, isLoading: accessLoading } = useOperatorAccess();
  const segments = useSegments();
  const lastSegment = segments[segments.length - 1];
  const currentRoute = typeof lastSegment === "string" ? lastSegment : "";
  const fullRoute = segments.join("/");
  const routesWithoutHeader: string[] = [];
  const showHeader = !routesWithoutHeader.includes(currentRoute);

  const isOnboardingRoute = currentRoute === "onboarding";

  const { currentOnboardingPoint } = useOnboardingStatus();

  useEffect(() => {
    if (accessLoading) {
      return;
    }

    if (fullRoute.startsWith("company/data") && !isAdmin) {
      router.replace("/(tabs)");
      return;
    }

    if (
      fullRoute.startsWith("company/points-program") &&
      !hasPermission(FEATURE_PERMISSIONS.pointsProgram.read[0]) &&
      !hasPermission(FEATURE_PERMISSIONS.pointsProgram.write[0])
    ) {
      router.replace("/(tabs)");
      return;
    }

    const restrictedRoutePermissions: {
      routePrefix: string;
      permission: OperatorPermission;
    }[] = [
        { routePrefix: "company/store", permission: FEATURE_PERMISSIONS.store.read[0] },
        { routePrefix: "company/coupons", permission: FEATURE_PERMISSIONS.coupons.read[0] },
        { routePrefix: "company/rewards", permission: FEATURE_PERMISSIONS.rewards.read[0] },
        { routePrefix: "company/streaks", permission: FEATURE_PERMISSIONS.streaks.read[0] },
        { routePrefix: "company/cooperators", permission: FEATURE_PERMISSIONS.cooperators.read[0] },
        { routePrefix: "company/stamp-card-template", permission: FEATURE_PERMISSIONS.stamps.read[0] },
        { routePrefix: "company/stats", permission: FEATURE_PERMISSIONS.merchant.read[0] },
      ];

    const matchedRoute = restrictedRoutePermissions.find((routePermission) =>
      fullRoute.startsWith(routePermission.routePrefix),
    );

    if (matchedRoute && !hasPermission(matchedRoute.permission)) {
      router.replace("/(tabs)");
    }
  }, [accessLoading, fullRoute, hasPermission, isAdmin]);

  const handleBack = () => {
    router.back();
  };

  return (
    <CustomSafeAreaView className="flex-1 bg-gray-50-light">
      {showHeader && (
        <HeaderWithBackButton showBackButton={true} onBack={handleBack} />
      )}
      {isOnboardingRoute && (
        <GlobalProgressBar
          currentStep={currentOnboardingPoint}
          totalSteps={TOTAL_ONBOARDING_POINTS}
          title={t("Company.onboardingTitle")}
          subtitle={t("Company.onboardingProgress", {
            current: currentOnboardingPoint,
            total: TOTAL_ONBOARDING_POINTS,
          })}
          className="mx-6 mt-4"
        />
      )}
      <View className="flex-1">
        <Stack
          screenOptions={{
            headerShown: false,
          }}
        />
      </View>
    </CustomSafeAreaView>
  );
}
