import { ProfileStackScrollScreen } from "@/components/molecules/ProfileStackScrollScreen";
import { SettingsNavSection } from "@/components/molecules/SettingsNavSection";
import { TechnicalScreenTitleRow } from "@/components/molecules/TechnicalScreenTitleRow";
import { EXTERNAL_LINKS } from "@/constants/externalLinks";
import { navigateProfileWebContent } from "@/utils/navigateProfileWebContent";
import React from "react";
import { useTranslation } from "react-i18next";

export default function LegalScreen() {
  const { t } = useTranslation();

  return (
    <ProfileStackScrollScreen>
      <TechnicalScreenTitleRow title={t("AccountHub.legalTitle")} />
      <SettingsNavSection
        title={t("AccountHub.legalTitle")}
        hideHeading
        items={[
          {
            title: t("AccountHub.legalTerms"),
            onPress: () =>
              navigateProfileWebContent(
                EXTERNAL_LINKS.platformTerms,
                t("AccountHub.legalTerms"),
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
              navigateProfileWebContent(EXTERNAL_LINKS.gdpr, t("AccountHub.legalGdpr")),
          },
        ]}
      />
    </ProfileStackScrollScreen>
  );
}
