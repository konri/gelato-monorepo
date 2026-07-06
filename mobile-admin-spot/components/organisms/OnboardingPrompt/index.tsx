import { CompanyOptionCard } from "@/components/molecules/CompanyOptionCard";
import { CompanySetupCard } from "@/components/molecules/CompanySetupCard";
import { useOnboardingStatus } from "@/hooks/useOnboardingStatus";
import { logger } from "@/utils/logger";
import { router } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { OnboardingPromptProps } from "./types";

export const OnboardingPrompt = ({ className }: OnboardingPromptProps) => {
  const { t } = useTranslation();
  const { hasCompany } = useOnboardingStatus();

  const cardTitle = hasCompany
    ? t("Company.continueCompanySetup")
    : t("Company.createCompanyProfile");

  const cardDescription = hasCompany
    ? t("Company.continueCompanySetupDescription")
    : t("Company.stepsRemaining", { count: 4 });

  const handleContinueOnboarding = () => {
    router.push("../company/onboarding");
  };

  const handleJoinCompany = () => {
    logger.log("Join company");
  };

  return (
    <View className={className}>
      <CompanySetupCard
        title={cardTitle}
        description={cardDescription}
        onPress={handleContinueOnboarding}
      />

      <CompanyOptionCard
        title={t("Company.joinExistingCompany")}
        description={t("Company.managerCanChangePermissions")}
        onPress={handleJoinCompany}
      />
    </View>
  );
};
