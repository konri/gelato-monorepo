import { MultiStepForm } from "@/components/organisms/MultiStepForm";
import { useGetCategories } from "@/hooks/graphql/queries/useGetCategories";
import { useOnboardingStatus } from "@/hooks/useOnboardingStatus";
import type { Category } from "@/shared/api-client/src/graphql/queries/categories/types";
import { router } from "expo-router";
import React, { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, View } from "react-native";
import { useCompanyStep } from "./steps/company";
import { useMerchantStep } from "./steps/merchant";
import { useStoreStep } from "./steps/store";
import { useSubscriptionStep } from "./steps/subscription";

const ONBOARDING_SUBSCRIPTION_STEP_ENABLED = false;

export default function OnboardingScreen() {
  const { t } = useTranslation();
  const {
    isLoading: onboardingLoading,
    hasCompany,
    hasMerchant,
    hasStore,
    hasSubscription,
    currentOnboardingPoint,
    isComplete,
    refetch: refetchOnboardingStatus,
  } = useOnboardingStatus();

  const initialStep = useMemo(() => {
    if (!hasCompany) return 1;
    if (!hasMerchant) return 2;
    if (!hasStore) return 3;
    if (ONBOARDING_SUBSCRIPTION_STEP_ENABLED && !hasSubscription) return 4;
    return 3;
  }, [hasCompany, hasMerchant, hasStore, hasSubscription]);

  const initialCompletedSteps = useMemo(() => {
    const completed = new Set<number>();
    if (hasCompany) completed.add(1);
    if (hasMerchant) completed.add(2);
    if (hasStore) completed.add(3);
    if (ONBOARDING_SUBSCRIPTION_STEP_ENABLED && hasSubscription) {
      completed.add(4);
    }
    return completed;
  }, [hasCompany, hasMerchant, hasStore, hasSubscription]);
  const { data: categoriesData, loading: categoriesLoading } =
    useGetCategories();
  const categories = (categoriesData?.getCategories || []) as Category[];

  const companyStep = useCompanyStep({
    company: null,
    hasCompanyAccess: hasCompany,
    onStepCompleted: refetchOnboardingStatus,
  });
  const merchantStep = useMerchantStep({
    categories,
    hasCompanyAccess: hasCompany,
    onStepCompleted: refetchOnboardingStatus,
  });
  const storeStep = useStoreStep({
    hasCompanyAccess: hasCompany,
    onStepCompleted: refetchOnboardingStatus,
    ...(ONBOARDING_SUBSCRIPTION_STEP_ENABLED
      ? {}
      : { createSubmitButtonText: t("Common.create") }),
  });
  const subscriptionStep = useSubscriptionStep({
    onStepCompleted: refetchOnboardingStatus,
  });

  useEffect(() => {
    if (!onboardingLoading && !categoriesLoading) {
      if (isComplete) {
        router.replace("/(tabs)");
        return;
      }

      const onboardingPointRoutes: Record<number, string> = {
        2: "/company/onboarding/loyalty-setup",
      };

      const targetRoute = onboardingPointRoutes[currentOnboardingPoint];
      if (targetRoute) {
        router.replace(targetRoute as any);
      }
    }
  }, [onboardingLoading, categoriesLoading, currentOnboardingPoint, isComplete]);

  if (onboardingLoading || categoriesLoading || isComplete) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#1A4196" />
      </View>
    );
  }

  const steps = ONBOARDING_SUBSCRIPTION_STEP_ENABLED
    ? [companyStep.step, merchantStep, storeStep, subscriptionStep]
    : [companyStep.step, merchantStep, storeStep];


  return (
    <MultiStepForm
      steps={steps}
      onCancel={() => router.back()}
      cancelButtonText={t("Common.cancel")}
      initialStep={initialStep}
      initialCompletedSteps={initialCompletedSteps}
    />
  );
}
