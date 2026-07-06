import { Typography } from "@/components/atoms/Typography";
import { HeaderWithBackButton } from "@/components/HeaderWithBackButton";
import { SecureAccountForm } from "@/components/molecules/SecureAccountForm";
import { useSecureAccount } from "@/hooks/useSecureAccount";
import React from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

export default function SecureAccountScreen() {
  const { t } = useTranslation();
  const { countryCode } = useSecureAccount();

  return (
    <>
      <HeaderWithBackButton
        title={t("SecureAccount.headerTitle")}
        variant="card"
      />
      <View className="flex-1 px-6 py-2">
        <View className="gap-8">
          <View>
            <Typography variant="text-32-bold" className="text-gray-900 mb-2">
              {t("SecureAccount.title")}
            </Typography>
            <Typography
              variant="text-18-regular-spaced"
              className="text-gray-600"
            >
              {t("SecureAccount.subtitle")}
            </Typography>
          </View>

          <SecureAccountForm countryCode={countryCode} />
        </View>
      </View>
    </>
  );
}
