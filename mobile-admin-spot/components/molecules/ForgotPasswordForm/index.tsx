import { FormInput } from "@/components/atoms/FormInput";
import { Form } from "@/components/molecules/Form";
import { safeSetItem } from "@/utils/safeAsyncStorage";
import { requestPasswordResetCode } from "@repo/api-client";
import React from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { ForgotPasswordFormData, ForgotPasswordFormProps } from "./types";

export const ForgotPasswordForm = ({}: ForgotPasswordFormProps) => {
  const { t } = useTranslation();

  const form = useForm<ForgotPasswordFormData>({
    defaultValues: {
      email: "",
    },
    mode: "onSubmit",
  });

  const handleSubmit = async (data: ForgotPasswordFormData) => {
    const response = await requestPasswordResetCode(data.email);

    if (response.error) {
      throw new Error(response.error);
    }

    await safeSetItem("pendingPasswordResetEmail", data.email);
  };

  return (
    <Form
      form={form}
      onSubmit={handleSubmit}
      successRoute="/verify-reset-code"
      submitButtonText={t("ForgotPassword.sendCode")}
      submitButtonStyle={{ width: "100%" }}
    >
      <FormInput
        name="email"
        type="email"
        required
        label={t("ForgotPassword.email")}
        placeholder={t("ForgotPassword.emailPlaceholder")}
        iconName="mail-outline"
        keyboardType="email-address"
        autoCapitalize="none"
      />
    </Form>
  );
};
