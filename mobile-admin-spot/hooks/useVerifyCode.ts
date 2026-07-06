import {
  safeMultiGet,
  safeRemoveItem,
} from "@/utils/safeAsyncStorage";
import {
  PENDING_VERIFICATION_ALLOW_IMMEDIATE_RESEND_KEY,
  PENDING_VERIFICATION_EMAIL_KEY,
} from "@/utils/verificationStorageKeys";
import { OTP_LENGTH, distributeOtpDigits } from "@/utils/distributeOtpDigits";
import { resendVerificationCode, verifyCode } from "@repo/api-client";
import { replaceClearingDismissableStack } from "@/utils/replaceClearingDismissableStack";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, TextInput } from "react-native";
import { useUserSync } from "./useUserSync";

export const useVerifyCode = () => {
  const { t } = useTranslation();
  const { handlePostLogin } = useUserSync();
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const [isResending, setIsResending] = useState(false);
  const [codeValidTimer, setCodeValidTimer] = useState(300);
  const inputRefs = useRef<TextInput[]>([]);

  useEffect(() => {
    const init = async () => {
      const [[, pendingEmail], [, allowImmediateResend]] = await safeMultiGet([
        PENDING_VERIFICATION_EMAIL_KEY,
        PENDING_VERIFICATION_ALLOW_IMMEDIATE_RESEND_KEY,
      ]);
      if (!pendingEmail) {
        router.replace("/signup");
        return;
      }
      setEmail(pendingEmail);
      if (allowImmediateResend === "true") {
        setResendTimer(0);
        await safeRemoveItem(PENDING_VERIFICATION_ALLOW_IMMEDIATE_RESEND_KEY);
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (codeValidTimer > 0) {
      const interval = setInterval(() => {
        setCodeValidTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [codeValidTimer]);

  useEffect(() => {
    if (resendTimer > 0) {
      const interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [resendTimer]);

  const formatCodeValidTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0
      ? `${mins}:${secs.toString().padStart(2, "0")}`
      : `${secs}s`;
  };

  const handleVerifyCode = async (fullCode: string) => {
    if (!email) return;

    setIsLoading(true);
    try {
      const response = await verifyCode({
        email,
        code: fullCode,
      });

      if (response.error) {
        Alert.alert(t("Common.error"), response.error);
        setCode(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
        return;
      }

      await safeRemoveItem(PENDING_VERIFICATION_EMAIL_KEY);
      await handlePostLogin(
        response.data.user,
        response.data.token.access_token,
        "email",
      );

      replaceClearingDismissableStack("/signup-details");
    } catch {
      Alert.alert(t("Common.error"), t("Common.verificationFailed"));
      setCode(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeChange = (value: string, index: number) => {
    const digitsOnly = value.replace(/\D/g, "");
    const newCode = distributeOtpDigits(code, value, index);
    setCode(newCode);

    if (digitsOnly.length === 0) {
      return;
    }

    if (digitsOnly.length > 1) {
      const filledCount = Math.min(digitsOnly.length, OTP_LENGTH - index);
      const lastIndex = Math.min(index + filledCount - 1, OTP_LENGTH - 1);
      inputRefs.current[lastIndex]?.focus();
    } else if (index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    const full = newCode.join("");
    if (
      newCode.every((digit) => digit !== "") &&
      full.length === OTP_LENGTH
    ) {
      handleVerifyCode(full);
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleResendCode = async () => {
    if (resendTimer > 0 || !email) return;

    setIsResending(true);
    try {
      const response = await resendVerificationCode(email);

      if (response.error) {
        Alert.alert(t("Common.error"), response.error);
        return;
      }

      setResendTimer(60);
      setCodeValidTimer(300);
      Alert.alert(t("Common.success"), t("VerifyCode.codeSent"));
    } catch {
      Alert.alert(t("Common.error"), t("VerifyCode.resendFailed"));
    } finally {
      setIsResending(false);
    }
  };

  return {
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
  };
};
