import { FormInput } from "@/components/atoms/FormInput";
import { FormSelect } from "@/components/atoms/FormSelect";
import React from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import type { CouponFormData } from "@/utils/couponForm";
import type { DiscountFieldsSharedProps } from "./types";

export const BirthdayCouponFields = ({
  discountTypeOptions,
  discountValueLabel,
  discountValueHelper,
}: DiscountFieldsSharedProps) => {
  const { t } = useTranslation();
  const form = useFormContext<CouponFormData>();
  const discountType = useWatch<CouponFormData, "discountType">({
    control: form.control,
    name: "discountType",
  });
  const maxDiscountValue = discountType === "PERCENTAGE" ? 100 : undefined;

  return (
    <View className="gap-4">
      <FormSelect
        name="discountType"
        label={t("Coupon.discountType")}
        placeholder={t("Coupon.selectDiscountType")}
        options={discountTypeOptions}
        required
        variant="compact"
      />
      <FormInput
        name="discountValue"
        label={discountValueLabel}
        helperText={discountValueHelper}
        placeholder="0"
        type="number"
        keyboardType="numeric"
        variant="compact"
        required
        min={0}
        max={maxDiscountValue}
      />
      <FormInput
        name="daysBeforeBirthday"
        label={t("Coupon.daysBeforeBirthday")}
        placeholder="0"
        type="number"
        keyboardType="numeric"
        variant="compact"
        min={0}
        integerOnly
      />
      <FormInput
        name="daysAfterBirthday"
        label={t("Coupon.daysAfterBirthday")}
        placeholder="0"
        type="number"
        keyboardType="numeric"
        variant="compact"
        min={0}
        integerOnly
      />
    </View>
  );
};
