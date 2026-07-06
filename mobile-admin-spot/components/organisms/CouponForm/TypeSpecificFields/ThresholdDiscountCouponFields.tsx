import { FormInput } from "@/components/atoms/FormInput";
import React from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import type { CouponFormData } from "@/utils/couponForm";

export const ThresholdDiscountCouponFields = () => {
  const { t } = useTranslation();
  const form = useFormContext<CouponFormData>();
  const thresholdAmount = useWatch({
    control: form.control,
    name: "thresholdAmount",
  });
  const normalizedThresholdAmount = thresholdAmount?.trim() ?? "";

  return (
    <View className="gap-4">
      <FormInput
        name="thresholdAmount"
        label={t("Coupon.thresholdAmount")}
        placeholder="0"
        type="number"
        keyboardType="numeric"
        variant="compact"
        required
        min={0}
      />
      <FormInput
        name="discountAmount"
        label={t("Coupon.discountAmount")}
        placeholder="0"
        type="number"
        keyboardType="numeric"
        variant="compact"
        required
        min={0}
        customValidation={{
          validate: (value) => {
            const normalizedValue = value.trim();
            if (!normalizedValue || !normalizedThresholdAmount) {
              return true;
            }
            const discountAmountValue = Number(normalizedValue);
            const thresholdAmountValue = Number(normalizedThresholdAmount);
            if (
              Number.isNaN(discountAmountValue) ||
              Number.isNaN(thresholdAmountValue) ||
              discountAmountValue <= thresholdAmountValue
            ) {
              return true;
            }
            return t("Validation.maxValue", { max: thresholdAmountValue });
          },
          message: t("Validation.invalidData"),
        }}
      />
    </View>
  );
};
