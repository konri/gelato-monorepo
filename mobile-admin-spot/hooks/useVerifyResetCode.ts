import { safeGetItem } from "@/utils/safeAsyncStorage";
import { OTP_LENGTH, distributeOtpDigits } from "@/utils/distributeOtpDigits";
import { requestPasswordResetCode } from "@repo/api-client";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, TextInput } from "react-native";

export const useVerifyResetCode = () => {
  const { t } = useTranslation();
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [email, setEmail] = useState("");
  const [resendTimer, setResendTimer] = useState(60);
  const [isResending, setIsResending] = useState(false);
  const [codeValidTimer, setCodeValidTimer] = useState(300);
  const inputRefs = useRef<TextInput[]>([]);

  useEffect(() => {
    const getEmail = async () => {
      const pendingEmail = await safeGetItem("pendingPasswordResetEmail");
      if (pendingEmail) {
        setEmail(pendingEmail);
      } else {
        router.replace("/forgot-password");
      }
    };
    getEmail();
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
      const response = await requestPasswordResetCode(email);

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
