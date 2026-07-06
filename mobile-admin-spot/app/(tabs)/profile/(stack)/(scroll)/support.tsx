import { Typography } from "@/components/atoms/Typography";
import { ProfileStackScrollScreen } from "@/components/molecules/ProfileStackScrollScreen";
import { SettingsNavSection } from "@/components/molecules/SettingsNavSection";
import { TechnicalScreenTitleRow } from "@/components/molecules/TechnicalScreenTitleRow";
import { EXTERNAL_LINKS, SUPPORT_EMAIL } from "@/constants/externalLinks";
import { logger } from "@/utils/logger";
import { navigateProfileWebContent } from "@/utils/navigateProfileWebContent";
import Constants from "expo-constants";
import * as Linking from "expo-linking";
import React from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

const buildMailto = (subjectKey: string, t: (k: string) => string) => {
  const subject = encodeURIComponent(t(subjectKey));
  return `mailto:${SUPPORT_EMAIL}?subject=${subject}`;
};

export default function SupportScreen() {
  const { t } = useTranslation();
  const version =
    Constants.expoConfig?.version ??
    (typeof Constants.nativeAppVersion === "string"
      ? Constants.nativeAppVersion
      : undefined) ??
    "—";

  const openMail = (mailto: string) => {
    Linking.openURL(mailto).catch((e) => logger.error("openMail", e));
  };

  return (
    <ProfileStackScrollScreen>
      <TechnicalScreenTitleRow title={t("AccountHub.supportTitle")} />
      <SettingsNavSection
        title={t("AccountHub.supportTitle")}
        hideHeading
        items={[
          {
            title: t("AccountHub.supportHelpCenter"),
            onPress: () =>
              navigateProfileWebContent(
                EXTERNAL_LINKS.helpCenter,
                t("AccountHub.supportHelpCenter"),
              ),
          },
          {
            title: t("AccountHub.supportReport"),
            onPress: () => openMail(buildMailto("AccountHub.mailReportSubject", t)),
          },
          {
            title: t("AccountHub.supportContact"),
            onPress: () => openMail(`mailto:${SUPPORT_EMAIL}`),
          },
          {
            title: t("AccountHub.supportStatus"),
            onPress: () =>
              navigateProfileWebContent(
                EXTERNAL_LINKS.systemStatus,
                t("AccountHub.supportStatus"),
              ),
          },
        ]}
      />
      <View className="items-center pt-2">
        <Typography variant="text-14-regular-spaced" className="text-gray-600">
          {t("AccountHub.appVersion", { version })}
        </Typography>
      </View>
    </ProfileStackScrollScreen>
  );
}
