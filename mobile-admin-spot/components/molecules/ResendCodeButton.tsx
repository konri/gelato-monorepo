import { Button } from "@/components/atoms/Button";
import React from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

interface ResendCodeButtonProps {
  resendTimer: number;
  isResending: boolean;
  onResend: () => void;
}

export const ResendCodeButton = ({
  resendTimer,
  isResending,
  onResend,
}: ResendCodeButtonProps) => {
  const { t } = useTranslation();

  const getButtonText = () => {
    if (isResending) {
      return t("Common.loading");
    }
    if (resendTimer > 0) {
      return `${t("VerifyCode.resendCode")} (${resendTimer}s)`;
    }
    return t("VerifyCode.resendCode");
  };

  return (
    <View className="items-center">
      <Button
        title={getButtonText()}
        onPress={onResend}
        variant="outline"
        disabled={resendTimer > 0 || isResending}
        width="auto"
        height={44}
        className="px-6 py-3"
      />
    </View>
  );
};
