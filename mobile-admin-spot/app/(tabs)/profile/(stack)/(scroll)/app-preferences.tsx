import { AppLanguageSelector } from "@/components/molecules/AppLanguageSelector";
import type { AppLanguageCode } from "@/components/molecules/AppLanguageSelector/types";
import { ProfileStackScrollScreen } from "@/components/molecules/ProfileStackScrollScreen";
import { TechnicalScreenTitleRow } from "@/components/molecules/TechnicalScreenTitleRow";
import { useLanguagePreference } from "@/hooks/useLanguagePreference";
import React from "react";
import { useTranslation } from "react-i18next";

export default function AppPreferencesScreen() {
  const { t } = useTranslation();
  const { currentUpper, setAppLanguage } = useLanguagePreference();

  const onSelectLanguage = (code: AppLanguageCode) => {
    void setAppLanguage(code);
  };

  return (
    <ProfileStackScrollScreen>
      <TechnicalScreenTitleRow title={t("AccountHub.languageHeading")} />
      <AppLanguageSelector
        currentUpper={currentUpper}
        onSelectLanguage={onSelectLanguage}
      />
    </ProfileStackScrollScreen>
  );
}
