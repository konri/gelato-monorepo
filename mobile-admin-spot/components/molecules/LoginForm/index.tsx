import { FormInput } from "@/components/atoms/FormInput";
import { Form } from "@/components/molecules/Form";
import { useAuth } from "@/hooks/useAuth";
import {
  LOGIN_VERIFY_REDIRECT_FORM_SENTINEL,
  isLoginVerifyRedirectFormSentinel,
  isRestLoginEmailNotVerifiedError,
  persistAndNavigateToVerifyCodeAfterLoginUnverified,
} from "@/utils/emailVerificationFlow";
import { useLocalSearchParams } from "expo-router";
import React from "react";
import type { UseFormReturn } from "react-hook-form";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { LoginFormData } from "./types";

type AuthError = { message?: string; status?: number };

const isAuthError = (error: unknown): error is AuthError =>
  typeof error === "object" && error !== null;

export const LoginForm = () => {
  const { t } = useTranslation();
  const { login } = useAuth();
  const { redirectTo } = useLocalSearchParams<{ redirectTo?: string }>();

  const form = useForm<LoginFormData>({
    defaultValues: {
      email: "",
      password: "",
    },
    mode: "onSubmit",
  });

  const handleSubmit = async (data: LoginFormData) => {
    try {
      const result = await login(data.email, data.password);
      if (!result) {
        throw new Error("Login failed");
      }
    } catch (error: unknown) {
      if (isRestLoginEmailNotVerifiedError(error)) {
        await persistAndNavigateToVerifyCodeAfterLoginUnverified(data.email.trim());
        throw LOGIN_VERIFY_REDIRECT_FORM_SENTINEL;
      }
      throw error;
    }
  };

  const handleError = (
    error: unknown,
    formInstance: UseFormReturn<LoginFormData>,
  ): boolean => {
    if (isLoginVerifyRedirectFormSentinel(error)) {
      return true;
    }

    if (!isAuthError(error)) {
      return false;
    }

    if (error.message === "Wrong password" && error.status === 401) {
      formInstance.setError("password", {
        type: "manual",
        message: t("Validation.wrongPassword"),
      });
      return true;
    }

    if (error.status === 401) {
      formInstance.setError("password", {
        type: "manual",
        message: t("Validation.invalidCredentials"),
      });
      return true;
    }

    return false;
  };

  return (
    <Form
      form={form}
      onSubmit={handleSubmit}
      onError={handleError}
      successRoute={redirectTo || "/(tabs)"}
      submitButtonText={t("SignIn.signIn")}
      submitButtonStyle={{ width: "100%", height: 56 }}
    >
      <FormInput
        name="email"
        type="email"
        required
        label={t("SignIn.email")}
        placeholder={t("SignIn.emailPlaceholder")}
        iconName="mail-outline"
        keyboardType="email-address"
        autoCapitalize="none"
        textContentType="emailAddress"
        autoComplete="email"
      />

      <FormInput
        name="password"
        type="password"
        required
        label={t("SignIn.password")}
        placeholder={t("SignIn.passwordPlaceholder")}
        iconName="lock-closed-outline"
        isPassword={true}
        textContentType="password"
        autoComplete="password"
      />
    </Form>
  );
};
