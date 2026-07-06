import { Typography } from "@/components/atoms/Typography";
import { KeyboardAwareScrollView } from "@/components/KeyboardAwareScrollView";
import { AuthHeader } from "@/components/molecules/AuthHeader";
import { CodeInput } from "@/components/molecules/CodeInput";
import { ResendCodeButton } from "@/components/molecules/ResendCodeButton";
import { useVerifyCode } from "@/hooks/useVerifyCode";
import React from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

export default function VerifyCodeScreen() {
  const { t } = useTranslation();
  const {
    code,
    email,
    isLoading,
    resendTimer,
    isResending,
    codeValidTimer,
    inputRefs,
    formatCodeValidTime,
    handleCodeChange,
    handleKeyPress,
    handleResendCode,
  } = useVerifyCode();

  return (
    <KeyboardAwareScrollView
      className="flex-1"
      contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 8 }}
      showsVerticalScrollIndicator={false}
    >
      <View className="gap-8">
        <AuthHeader
          title={t("VerifyCode.title")}
          subtitle={`${t("VerifyCode.subtitle")} ${email}`}
        />

        <View className="gap-6">
          <View className="items-center">
            <Typography
              variant="text-12-regular"
              className={
                codeValidTimer > 0 ? "text-gray-600" : "text-accent"
              }
            >
              {codeValidTimer > 0
                ? `${t("VerifyCode.codeValidFor")} ${formatCodeValidTime(
                    codeValidTimer
                  )}`
                : t("VerifyCode.codeExpired")}
            </Typography>
          </View>

          <View>
            <Typography
              variant="text-18-semibold-spaced"
              className="text-gray-900 mb-4"
            >
              {t("VerifyCode.codeLabel")}
            </Typography>
            <CodeInput
              code={code}
              inputRefs={inputRefs}
              isLoading={isLoading}
              onCodeChange={handleCodeChange}
              onKeyPress={handleKeyPress}
            />
          </View>

          <View className="items-center">
            <ResendCodeButton
              resendTimer={resendTimer}
              isResending={isResending}
              onResend={handleResendCode}
            />
          </View>
        </View>
      </View>
    </KeyboardAwareScrollView>
  );
}
