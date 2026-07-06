import { FormInput } from "@/components/atoms/FormInput";
import { Form } from "@/components/molecules/Form";
import { safeRemoveItem } from "@/utils/safeAsyncStorage";
import { resetPasswordWithCode } from "@repo/api-client";
import { router } from "expo-router";
import React from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Alert } from "react-native";
import { ResetPasswordFormData, ResetPasswordFormProps } from "./types";

export const ResetPasswordForm = ({ code, email }: ResetPasswordFormProps) => {
  const { t } = useTranslation();

  const form = useForm<ResetPasswordFormData>({
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
    mode: "onSubmit",
  });

  const password = form.watch("password");

  const handleSubmit = async (data: ResetPasswordFormData) => {
    const fullCode = code.join("");
    if (fullCode.length !== 6) {
      Alert.alert(t("Common.error"), t("Common.enterSixDigitCode"));
      throw new Error("Invalid code");
    }

    const response = await resetPasswordWithCode(
      email,
      fullCode,
      data.password
    );

    if (response.error) {
      throw new Error(response.error);
    }

    await safeRemoveItem("pendingPasswordResetEmail");
    Alert.alert(t("Common.success"), t("Common.passwordChanged"));
    router.replace("/login");
  };

  return (
    <Form
      form={form}
      onSubmit={handleSubmit}
      submitButtonText={t("ResetPassword.changePassword")}
      submitButtonStyle={{ width: "100%" }}
      className="gap-4"
    >
      <FormInput
        name="password"
        type="password"
        required
        label={t("ResetPassword.password")}
        placeholder={t("ResetPassword.passwordPlaceholder")}
        iconName="lock-closed-outline"
        isPassword={true}
      />

      <FormInput
        name="confirmPassword"
        type="password"
        required
        label={t("ResetPassword.confirmPassword")}
        placeholder={t("ResetPassword.passwordPlaceholder")}
        iconName="lock-closed-outline"
        isPassword={true}
        customValidation={{
          validate: (value: string) => {
            return value === password;
          },
          message: t("Common.passwordsNotMatch"),
        }}
      />
    </Form>
  );
};
