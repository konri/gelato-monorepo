import { FormInput } from "@/components/atoms/FormInput";
import { Form } from "@/components/molecules/Form";
import { TermsCheckbox } from "@/components/molecules/TermsCheckbox";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { signupUser } from "@repo/api-client";
import React, { useState } from "react";
import { useForm, UseFormReturn } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Alert } from "react-native";
import { SignupFormData, SignupFormProps } from "./types";

export const SignupForm = ({}: SignupFormProps) => {
  const { t } = useTranslation();
  const [agreeToTerms, setAgreeToTerms] = useState(false);

  const form = useForm<SignupFormData>({
    defaultValues: {
      name: "",
      email: "",
      password: "",
      referralCode: "",
      registrationSource: "MOBILE_CLIENT",
    },
    mode: "onSubmit",
  });

  const handleSubmit = async (data: SignupFormData) => {
    if (!agreeToTerms) {
      Alert.alert(t("Common.error"), t("Common.agreeToTerms"));
      throw new Error("Terms not agreed");
    }

    const response = await signupUser(data);

    if (response.error) {
      if (
        response.error.includes("email") ||
        response.error.includes("Email") ||
        response.error.includes("exists")
      ) {
        throw { status: 409, field: "email", message: response.error };
      }
      throw new Error(response.error);
    }

    // Signup sends an OTP email; the verify-code screen confirms it and logs in.
    await AsyncStorage.setItem("pendingVerificationEmail", data.email);
  };

  const handleError = (
    error: unknown,
    form: UseFormReturn<SignupFormData>
  ): boolean => {
    const err = error as {
      status?: number;
      field?: string;
      message?: string;
    };

    if (err?.message === "Terms not agreed") {
      return true;
    }

    if (err?.status === 409 || err?.message?.includes("409")) {
      form.setError("email", {
        type: "manual",
        message: t("Validation.emailExists"),
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
      successRoute="/verify-code"
      submitButtonText={t("SignUp.signUp")}
      submitButtonStyle={{ width: "100%" }}
    >
      <FormInput
        name="email"
        type="email"
        label={t("SignUp.email")}
        required
        placeholder={t("SignUp.emailPlaceholder")}
        iconName="mail-outline"
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <FormInput
        name="password"
        type="password"
        required
        label={t("SignUp.password")}
        placeholder={t("SignUp.passwordPlaceholder")}
        iconName="lock-closed-outline"
        isPassword={true}
      />

      <FormInput
        name="referralCode"
        type="referralCode"
        label={t("SignUp.referralCode")}
        placeholder={t("SignUp.referralCodePlaceholder")}
        iconName="gift-outline"
        autoCapitalize="characters"
        maxLength={9}
      />

      <TermsCheckbox
        checked={agreeToTerms}
        onToggle={() => setAgreeToTerms(!agreeToTerms)}
        text={t("SignUp.agreeToTerms")}
        linkText={t("SignUp.termsAndConditions")}
      />
    </Form>
  );
};
