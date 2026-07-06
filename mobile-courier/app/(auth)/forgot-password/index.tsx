import { AuthHeader } from "@/components/molecules/AuthHeader";
import { ForgotPasswordForm } from "@/components/molecules/ForgotPasswordForm";
import React from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, View } from "react-native";

export default function ForgotPasswordScreen() {
  const { t } = useTranslation();

  return (
    <ScrollView
      className="flex-1"
      contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 8 }}
      showsVerticalScrollIndicator={false}
    >
      <View className="gap-8">
        <AuthHeader
          title={t("ForgotPassword.title")}
          subtitle={t("ForgotPassword.subtitle")}
        />

        <ForgotPasswordForm />
      </View>
    </ScrollView>
  );
}
