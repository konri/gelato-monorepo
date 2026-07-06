import { Typography } from "@/components/atoms/Typography";
import { AuthHeader } from "@/components/molecules/AuthHeader";
import { CodeInput } from "@/components/molecules/CodeInput";
import { ResendCodeButton } from "@/components/molecules/ResendCodeButton";
import { ResetPasswordForm } from "@/components/molecules/ResetPasswordForm";
import { useVerifyResetCode } from "@/hooks/useVerifyResetCode";
import React from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, Text, View } from "react-native";

export default function VerifyResetCodeScreen() {
  const { t } = useTranslation();
  const {
    code,
    email,
    resendTimer,
    isResending,
    codeValidTimer,
    inputRefs,
    formatCodeValidTime,
    handleCodeChange,
    handleKeyPress,
    handleResendCode,
  } = useVerifyResetCode();

  return (
    <ScrollView
      className="flex-1"
      contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 8 }}
      showsVerticalScrollIndicator={false}
    >
      <View className="gap-8">
        <AuthHeader
          title={t("ResetPassword.title")}
          subtitle={t("ResetPassword.subtitle")}
        />

        <View className="gap-6">
          <View className="items-center">
            <Text
              className={`text-sm ${
                codeValidTimer > 0 ? "text-gray-500" : "text-red-500"
              }`}
              style={{ fontFamily: "Urbanist" }}
            >
              {codeValidTimer > 0
                ? `${t("VerifyCode.codeValidFor")} ${formatCodeValidTime(
                    codeValidTimer
                  )}`
                : t("VerifyCode.codeExpired")}
            </Text>
          </View>

          <View>
            <Typography
              variant="body-lg-semibold"
              className="text-text-primary mb-4"
            >
              {t("VerifyCode.codeLabel")}
            </Typography>
            <CodeInput
              code={code}
              inputRefs={inputRefs}
              isLoading={false}
              onCodeChange={handleCodeChange}
              onKeyPress={handleKeyPress}
            />
          </View>

          <ResetPasswordForm code={code} email={email} />

          <View className="items-center">
            <ResendCodeButton
              resendTimer={resendTimer}
              isResending={isResending}
              onResend={handleResendCode}
            />
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
