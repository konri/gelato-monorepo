import { Typography } from "@/components/atoms/Typography";
import { ActionButtons } from "@/components/organisms/MultiStepForm/ActionButtons";
import { useFormEditable } from "@/hooks/useFormEditable";
import { router } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { useCouponWizardForm } from "./_layout";
import { CouponWizardStepContainer } from "./CouponWizardStepContainer";

export default function CouponPreviewStepScreen() {
  const { t } = useTranslation();
  const { isSaving, submitCoupon, isEditMode } = useCouponWizardForm();
  const canEditCoupons = useFormEditable();

  return (
    <CouponWizardStepContainer>
      <View className="gap-4 pb-4">
        <Typography variant="text-14-regular-spaced" className="text-black-47">
          {t("Coupon.commonFieldsDescription")}
        </Typography>
        <ActionButtons
          onSubmit={submitCoupon}
          onCancel={() => router.back()}
          submitButtonText={isEditMode ? t("Common.save") : t("Common.create")}
          cancelButtonText={t("Common.back")}
          isSubmitting={isSaving}
          canSubmit={canEditCoupons}
        />
      </View>
    </CouponWizardStepContainer>
  );
}
