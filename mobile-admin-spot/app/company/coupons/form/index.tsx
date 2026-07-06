import { FormSelect } from "@/components/atoms/FormSelect";
import { CouponTypeSpecificFields } from "@/components/organisms/CouponForm/TypeSpecificFields";
import { ActionButtons } from "@/components/organisms/MultiStepForm/ActionButtons";
import type { CouponType } from "@/shared/api-client/src/graphql/mutations/coupon";
import {
  getActivityTypeOptions,
  getCouponTypeOptions,
  getDayOfWeekOptions,
  getDiscountTypeOptions,
  type CouponFormData,
} from "@/utils/couponForm";
import { router } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { useCouponWizardForm } from "./_layout";
import { CouponWizardStepContainer } from "./CouponWizardStepContainer";
import { useCouponTypeDefaults } from "./useCouponTypeDefaults";

const TYPE_SPECIFIC_FIELDS: Record<CouponType, Array<keyof CouponFormData>> = {
  MULTI_BUY: ["buyQuantity", "getQuantity"],
  DISCOUNT: ["discountType", "discountValue"],
  DAY_OF_WEEK: ["dayOfWeek", "discountType", "discountValue"],
  THRESHOLD_DISCOUNT: ["thresholdAmount", "discountAmount"],
  ITEM_SPECIFIC: ["itemName", "discountType", "discountValue"],
  BIRTHDAY: [
    "discountType",
    "discountValue",
    "daysBeforeBirthday",
    "daysAfterBirthday",
  ],
  ACTIVITY: ["activityType", "discountType", "discountValue"],
};

export default function CouponTypeStepScreen() {
  const { t } = useTranslation();
  const {
    form,
    selectedRewardTitle,
    openRewardPicker,
    clearRewardSelection,
    isEditMode,
    isClaimLocked,
    isStoreOverrideEdit,
  } = useCouponWizardForm();
  const { couponType, discountType } = useCouponTypeDefaults({
    form,
    t,
    enabled: true,
    isEditMode,
  });

  const couponTypeOptions = getCouponTypeOptions(t);
  const discountTypeOptions = getDiscountTypeOptions(t);
  const dayOfWeekOptions = getDayOfWeekOptions(t);
  const activityTypeOptions = getActivityTypeOptions(t);
  const discountValueLabel =
    discountType === "PERCENTAGE"
      ? t("Coupon.discountValuePercentage")
      : t("Coupon.discountValueAmount");
  const discountValueHelper =
    discountType === "PERCENTAGE"
      ? t("Coupon.discountValuePercentageHelper")
      : t("Coupon.discountValueAmountHelper");

  const handleNext = async () => {
    if (isStoreOverrideEdit) {
      const isValid = await form.trigger();
      if (isValid) {
        router.push("/company/coupons/form/details");
      }
      return;
    }
    const fieldsToValidate: Array<keyof CouponFormData> = [
      "couponType",
      ...TYPE_SPECIFIC_FIELDS[couponType],
    ];
    const isValid = await form.trigger(fieldsToValidate);

    if (isValid) {
      router.push("/company/coupons/form/details");
    }
  };

  return (
    <CouponWizardStepContainer>
      <View className="gap-4 pb-4">
        <FormSelect
          name="couponType"
          label={t("Coupon.couponType")}
          placeholder={t("Coupon.selectCouponType")}
          options={couponTypeOptions}
          helperText={t(`Coupon.type${couponType}Helper`)}
          editable={
            isEditMode && !isStoreOverrideEdit ? false : isClaimLocked ? false : undefined
          }
          required
          variant="compact"
        />
        <CouponTypeSpecificFields
          couponType={couponType}
          discountTypeOptions={discountTypeOptions}
          dayOfWeekOptions={dayOfWeekOptions}
          activityTypeOptions={activityTypeOptions}
          discountValueLabel={discountValueLabel}
          discountValueHelper={discountValueHelper}
          selectedRewardTitle={selectedRewardTitle}
          onOpenRewardPicker={openRewardPicker}
          onClearRewardSelection={clearRewardSelection}
          isRewardSelectionLocked={isClaimLocked}
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
