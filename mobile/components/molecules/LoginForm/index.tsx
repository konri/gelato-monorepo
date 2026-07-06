import { FormInput } from "@/components/atoms/FormInput";
import { Form } from "@/components/molecules/Form";
import { useAuth } from "@/hooks/useAuth";
import React from "react";
import { useForm, UseFormReturn } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { LoginFormData, LoginFormProps } from "./types";

export const LoginForm = ({}: LoginFormProps) => {
  const { t } = useTranslation();
  const { login } = useAuth();

  const form = useForm<LoginFormData>({
    defaultValues: {
      email: "",
      password: "",
    },
    mode: "onSubmit",
  });

  const handleSubmit = async (data: LoginFormData) => {
    const result = await login(data.email, data.password);
    if (!result) {
      throw new Error("Login failed");
    }
  };

  const handleError = (
    error: unknown,
    formInstance: UseFormReturn<LoginFormData>
  ): boolean => {
    const err = error as { message?: string; status?: number };

    if (err?.message === "Wrong password" && err?.status === 401) {
      formInstance.setError("password", {
        type: "manual",
        message: t("Validation.wrongPassword"),
      });
      return true;
    }

    if (err?.status === 401) {
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
      successRoute="/(tabs)"
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
      />

      <FormInput
        name="password"
        required
        label={t("SignIn.password")}
        placeholder={t("SignIn.passwordPlaceholder")}
        iconName="lock-closed-outline"
        isPassword={true}
      />
    </Form>
  );
};
