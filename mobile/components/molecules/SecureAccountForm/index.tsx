import { FormInput } from "@/components/atoms/FormInput";
import { Form } from "@/components/molecules/Form";
import { router } from "expo-router";
import React from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Alert, Pressable, Text, View } from "react-native";
import { SecureAccountFormData, SecureAccountFormProps } from "./types";

export const SecureAccountForm = ({ countryCode }: SecureAccountFormProps) => {
  const { t } = useTranslation();

  const form = useForm<SecureAccountFormData>({
    defaultValues: {
      phoneNumber: "",
    },
    mode: "onSubmit",
  });

  const handleSubmit = async (data: SecureAccountFormData) => {
    Alert.alert(t("Common.success"), t("Common.verificationCodeSent"));
  };

  return (
    <>
      <Form
        form={form}
        onSubmit={handleSubmit}
        successRoute="/verify-code"
        submitButtonText={t("SecureAccount.sendCode")}
        submitButtonStyle={{ width: "100%" }}
      >
        <FormInput
          name="phoneNumber"
          type="phone"
          required={true}
          label={t("SecureAccount.phoneNumber")}
          placeholder={t("SecureAccount.phonePlaceholder")}
          prefix={countryCode}
          keyboardType="phone-pad"
        />

        <View className="mb-8">
          <Text
            className="text-base text-gray-600"
            style={{
              fontFamily: "Urbanist",
              lineHeight: 25.6,
              letterSpacing: 0.2,
            }}
          >
            {t("SecureAccount.infoText")}
          </Text>
        </View>
      </Form>

      <View className="items-center">
        <Pressable onPress={() => router.replace("/")}>
          <Text
            className="text-lg text-gray-700 font-semibold"
            style={{ fontFamily: "Urbanist" }}
          >
            {t("SecureAccount.skip")}
          </Text>
        </Pressable>
      </View>
    </>
  );
};
