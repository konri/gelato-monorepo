import { FormDatePicker } from "@/components/atoms/FormDatePicker";
import { FormInput } from "@/components/atoms/FormInput";
import { Typography } from "@/components/atoms/Typography";
import { CircularMerchantLogoPicker } from "@/components/molecules/CircularMerchantLogoPicker";
import { Form } from "@/components/molecules/Form";
import { useProfileAvatarPicker } from "@/hooks/useProfileAvatarPicker";
import { useProfileUpdate } from "@/hooks/useProfileUpdate";
import { safeRemoveItem } from "@/utils/safeAsyncStorage";
import { validateBirthDate } from "@/utils/validators";
import React, { useCallback, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Alert, View } from "react-native";
import type { SignUpDetailsFormData, SignUpDetailsFormProps } from "./types";

const EMPTY_DEFAULTS: SignUpDetailsFormData = {
  firstName: "",
  surname: "",
  phone: "",
  birthDate: "",
  referralCode: "",
};

export const SignUpDetailsForm = ({
  remoteUri,
  isFirstTimeLogin = false,
  defaultValues,
  onSuccess,
  showReferralCode = false,
  successRoute,
  submitButtonText,
  footer,
}: SignUpDetailsFormProps) => {
  const { t } = useTranslation();
  const { displayUri, handleImageChange, handleImageRemove, resolveUrlForSubmit } =
    useProfileAvatarPicker({ remoteUri });
  const { submitProfileUpdate } = useProfileUpdate();

  const form = useForm<SignUpDetailsFormData>({
    defaultValues: { ...EMPTY_DEFAULTS, ...defaultValues },
    mode: "onSubmit",
  });

  useEffect(() => {
    if (!defaultValues) return;
    form.reset({ ...EMPTY_DEFAULTS, ...defaultValues });
  }, [defaultValues, form]);

  const handleSubmit = useCallback(
    async (data: SignUpDetailsFormData) => {
      const pictureUrl = await resolveUrlForSubmit();
      await submitProfileUpdate(data, pictureUrl ?? null, isFirstTimeLogin);
      if (isFirstTimeLogin) {
        await safeRemoveItem("isFirstTimeLogin");
      }
      onSuccess?.();
    },
    [resolveUrlForSubmit, submitProfileUpdate, isFirstTimeLogin, onSuccess],
  );

  const handleError = (error: unknown): boolean => {
    const message =
      error instanceof Error && error.message.length > 0
        ? error.message
        : t("Common.saveDataFailed");
    Alert.alert(t("Common.error"), message);
    return true;
  };

  return (
    <>
      <View className="mt-4">
        <Typography variant="text-18-semibold" className="text-gray-900 mb-4">
          {t("SignUpDetails.setAvatar")}
        </Typography>
        <View className="items-center">
          <CircularMerchantLogoPicker
            className="h-32 w-32"
            variant="profile"
            imageUri={displayUri}
            onChange={handleImageChange}
            onRemove={displayUri != null ? handleImageRemove : undefined}
            pickAccessibilityLabel={t("SignUpDetails.changeAvatar")}
            removeAccessibilityLabel={t("SignUpDetails.removeAvatar")}
          />
        </View>
      </View>

      <Form
        form={form}
        onSubmit={handleSubmit}
        onError={handleError}
        successRoute={successRoute}
        submitButtonText={submitButtonText ?? t("SignUpDetails.save")}
        submitButtonSize="md"
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
          placeholder={t("SignUpDetails.phonePlaceholder")}
          iconName="call-outline"
          keyboardType="phone-pad"
        />

        <FormDatePicker
          name="birthDate"
          label={t("SignUpDetails.birthDate")}
          placeholder={t("SignUpDetails.birthDatePlaceholder")}
          variant="primary"
          confirmValue="yyyy-mm-dd-local"
          minAgeYears={13}
          maxAgeYears={126}
          customValidation={{
            validate: (value: string | undefined) =>
              !value || validateBirthDate(value)
                ? true
                : t("Validation.birthDateInvalidWithAge"),
          }}
        />

        {showReferralCode && (
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

        {footer}
      </Form>
    </>
  );
};
