import { FormInput } from "@/components/atoms/FormInput";
import { ActionButtons } from "@/components/organisms/MultiStepForm/ActionButtons";
import { router } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { useCouponWizardForm } from "./_layout";
import { CouponWizardStepContainer } from "./CouponWizardStepContainer";
import {
  COUPON_DESCRIPTION_MAX_LENGTH,
  COUPON_SHORT_DESCRIPTION_MAX_LENGTH,
  COUPON_TERMS_AND_CONDITION_MAX_LENGTH,
  COUPON_TITLE_MAX_LENGTH,
} from "./textLimits";

export default function CouponBasicDetailsStepScreen() {
  const { t } = useTranslation();
  const { form, isEditMode, isStoreOverrideEdit } = useCouponWizardForm();

  const handleNext = async () => {
    if (isStoreOverrideEdit) {
      const isValid = await form.trigger();
      if (isValid) {
        router.push("/company/coupons/form/common");
      }
      return;
    }
    const isValid = await form.trigger(["code", "title"]);
    if (isValid) {
      router.push("/company/coupons/form/common");
    }
  };

  return (
    <CouponWizardStepContainer>
      <View className="gap-4 pb-4">
        <FormInput
          name="code"
          label={t("Coupon.code")}
          placeholder={t("Coupon.codePlaceholder")}
          type="text"
          editable={!isEditMode ? undefined : false}
          required
          variant="compact"
        />

        <FormInput
          name="title"
          label={t("Coupon.title")}
          placeholder={t("Coupon.titlePlaceholder")}
          type="text"
          required
          variant="compact"
          maxLength={COUPON_TITLE_MAX_LENGTH}
          helperText={t("Coupon.titleHelper")}
        />

        <FormInput
          name="shortDescription"
          label={t("Coupon.shortDescription")}
          placeholder={t("Coupon.shortDescriptionPlaceholder")}
          type="text"
          variant="compact"
          maxLength={COUPON_SHORT_DESCRIPTION_MAX_LENGTH}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
          helperText={t("Coupon.shortDescriptionHelper")}
        />

        <FormInput
          name="description"
          label={t("Coupon.promotionRules")}
          placeholder={t("Coupon.descriptionPlaceholder")}
          type="text"
          variant="compact"
          maxLength={COUPON_DESCRIPTION_MAX_LENGTH}
          multiline
          numberOfLines={8}
          textAlignVertical="top"
          helperText={t("Coupon.descriptionModalHelper")}
        />

        <FormInput
          name="termsAndCondition"
          label={t("Coupon.termsAndCondition")}
          placeholder={t("Coupon.termsAndConditionPlaceholder")}
          type="text"
          variant="compact"
          maxLength={COUPON_TERMS_AND_CONDITION_MAX_LENGTH}
          multiline
          numberOfLines={10}
          textAlignVertical="top"
          helperText={t("Coupon.definePromotionConditions")}
        />

        <ActionButtons
          onSubmit={handleNext}
          onCancel={() => router.back()}
          submitButtonText={t("Common.next")}
          cancelButtonText={t("Common.back")}
          canSubmit
        />
      </View>
    </CouponWizardStepContainer>
  );
}
