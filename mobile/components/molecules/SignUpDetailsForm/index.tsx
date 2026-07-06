import { FormInput } from "@/components/atoms/FormInput";
import { Typography } from "@/components/atoms/Typography";
import { Form } from "@/components/molecules/Form";
import { updateProfile } from "@/shared/api-client";
import {
    formatBirthDate as formatDate,
    formatPhoneNumber,
    validateBirthDate,
} from "@/utils/validators";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Alert, Image, Pressable, Text, View } from "react-native";
import { SignUpDetailsFormData, SignUpDetailsFormProps } from "./types";
import { buildUpdateData } from "./utils";

export const SignUpDetailsForm = ({
  onSkip,
  isFirstTimeLogin,
  profileImage,
  phoneNumber,
  onImagePick,
}: SignUpDetailsFormProps) => {
  const { t } = useTranslation();

  // Remove +48 prefix from phone number if present (prefix is shown separately)
  const phoneWithoutPrefix = phoneNumber?.startsWith('+48') 
    ? phoneNumber.substring(3) 
    : phoneNumber || '';

  // Format phone with spaces
  const formattedPhone = formatPhoneNumber(phoneWithoutPrefix);

  const form = useForm<SignUpDetailsFormData>({
    defaultValues: {
      firstName: "",
      surname: "",
      phone: formattedPhone,
      birthDate: "",
      referralCode: "",
    },
    mode: "onSubmit",
  });

  // Update phone field when phoneNumber prop changes
  useEffect(() => {
    if (formattedPhone) {
      form.setValue('phone', formattedPhone);
    }
  }, [formattedPhone, form]);

  const handleBirthDateChange = (text: string) => {
    return formatDate(text);
  };

  const handlePhoneChange = (text: string) => {
    return formatPhoneNumber(text);
  };

  const handleSubmit = async (data: SignUpDetailsFormData) => {
    const updateData = buildUpdateData(data, profileImage, isFirstTimeLogin);

    if (Object.keys(updateData).length > 0) {
      const result = await updateProfile({ data: updateData });

      if (!result.success || !result.data) {
        throw new Error(result.error?.message || t("Validation.updateFailed"));
      }

      const currentUserData = await AsyncStorage.getItem("userData");
      if (currentUserData) {
        const userData = JSON.parse(currentUserData);
        const updatedUserData = {
          ...userData,
          ...result.data,
        };
        await AsyncStorage.setItem("userData", JSON.stringify(updatedUserData));
      }
    }

    if (isFirstTimeLogin) {
      await AsyncStorage.removeItem("isFirstTimeLogin");
    }
  };

  const handleError = (error: unknown): boolean => {
    const err = error as { message?: string };

    Alert.alert(t("Common.error"), err?.message || t("Common.saveDataFailed"));
    return true;
  };

  return (
    <>
      <View className="mt-4">
        <Typography
          variant="body-lg-semibold"
          className="text-text-primary mb-4"
        >
          {t("SignUpDetails.setAvatar")}
        </Typography>
        <View className="items-center">
          <Pressable
            onPress={onImagePick}
            className="w-30 h-30 rounded-full bg-white border-2 border-gray-200 items-center justify-center"
          >
            {profileImage ? (
              <Image
                source={{ uri: profileImage }}
                className="w-full h-full rounded-full"
              />
            ) : (
              <Ionicons name="camera-outline" size={32} color="#9E9E9E" />
            )}
          </Pressable>
        </View>
      </View>

      <Form
        form={form}
        onSubmit={handleSubmit}
        onError={handleError}
        successRoute="/location"
        submitButtonText={t("SignUpDetails.save")}
      >
        <FormInput
          name="firstName"
          type="text"
          label={t("SignUpDetails.firstName")}
          placeholder={t("SignUpDetails.firstNamePlaceholder")}
          iconName="person-outline"
          autoCapitalize="words"
        />

        <FormInput
          name="surname"
          type="text"
          label={t("SignUpDetails.surname")}
          placeholder={t("SignUpDetails.surnamePlaceholder")}
          iconName="person-outline"
          autoCapitalize="words"
        />

        <FormInput
          name="phone"
          type="phone"
          label={t("SignUpDetails.phone")}
          placeholder="123 456 789"
          iconName="call-outline"
          keyboardType="phone-pad"
          prefix="+48"
          onChangeText={handlePhoneChange}
        />

        <FormInput
          name="birthDate"
          type="text"
          label={t("SignUpDetails.birthDate")}
          placeholder={t("SignUpDetails.birthDatePlaceholder")}
          iconName="calendar-outline"
          keyboardType="numeric"
          maxLength={10}
          onChangeText={handleBirthDateChange}
          customValidation={{
            validate: (value: string) => !value || validateBirthDate(value),
            message: t("Validation.birthDateInvalidWithAge"),
          }}
        />

        {isFirstTimeLogin && (
          <FormInput
            name="referralCode"
            type="referralCode"
            label={t("SignUpDetails.referralCode")}
            placeholder={t("SignUpDetails.referralCodePlaceholder")}
            iconName="gift-outline"
            autoCapitalize="characters"
            maxLength={9}
          />
        )}

        <View className="flex-1 justify-end items-center">
          <Pressable onPress={onSkip || (() => router.replace("/location"))}>
            <Text
              className="text-center text-gray-500 text-lg"
              style={{ fontFamily: "Urbanist" }}
            >
              {t("SignUpDetails.skip")}
            </Text>
          </Pressable>
        </View>
      </Form>
    </>
  );
};
