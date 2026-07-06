import { FormInput } from "@/components/atoms/FormInput";
import { Form } from "@/components/molecules/Form";
import { changePasswordLoggedIn } from "@repo/api-client";
import { router } from "expo-router";
import React from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Alert } from "react-native";
import type { ChangePasswordFormData } from "./types";

export const ChangePasswordForm = () => {
  const { t } = useTranslation();

  const form = useForm<ChangePasswordFormData>({
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
    mode: "onSubmit",
  });

  const newPassword = form.watch("newPassword");

  const handleSubmit = async (data: ChangePasswordFormData) => {
    const response = await changePasswordLoggedIn(
      data.currentPassword,
      data.newPassword,
    );

    if (response.error) {
      throw new Error(response.error);
    }

    Alert.alert(t("Common.success"), t("AccountHub.changePasswordSuccess"));
    router.back();
  };

  return (
    <Form
      form={form}
      onSubmit={handleSubmit}
      submitButtonText={t("AccountHub.changePasswordSubmit")}
      submitButtonSize="sm"
      className="gap-4"
    >
      <FormInput
        name="currentPassword"
        type="password"
        required
        label={t("AccountHub.changePasswordCurrent")}
        placeholder={t("AccountHub.changePasswordCurrentPlaceholder")}
        iconName="lock-closed-outline"
        isPassword
      />

      <FormInput
        name="newPassword"
        type="password"
        required
        label={t("ResetPassword.password")}
        placeholder={t("ResetPassword.passwordPlaceholder")}
        iconName="lock-closed-outline"
        isPassword
      />

      <FormInput
        name="confirmPassword"
        type="password"
        required
        label={t("ResetPassword.confirmPassword")}
        placeholder={t("ResetPassword.passwordPlaceholder")}
        iconName="lock-closed-outline"
        isPassword
        customValidation={{
          validate: (value: string) => value === newPassword,
          message: t("Common.passwordsNotMatch"),
        }}
      />
    </Form>
  );
};
