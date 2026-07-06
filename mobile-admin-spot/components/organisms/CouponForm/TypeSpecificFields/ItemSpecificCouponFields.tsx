import { FormInput } from "@/components/atoms/FormInput";
import { FormSelect } from "@/components/atoms/FormSelect";
import { CouponRewardPickerField } from "@/components/organisms/CouponRewardPickerField";
import React from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import type { CouponFormData } from "@/utils/couponForm";
import type { DiscountFieldsSharedProps, RewardPickerFieldsProps } from "./types";

export const ItemSpecificCouponFields = ({
  discountTypeOptions,
  discountValueLabel,
  discountValueHelper,
  selectedRewardTitle,
  onOpenRewardPicker,
  onClearRewardSelection,
  isRewardSelectionLocked,
}: DiscountFieldsSharedProps & RewardPickerFieldsProps) => {
  const { t } = useTranslation();
  const form = useFormContext<CouponFormData>();
  const discountType = useWatch<CouponFormData, "discountType">({
    control: form.control,
    name: "discountType",
  });
  const maxDiscountValue = discountType === "PERCENTAGE" ? 100 : undefined;

  return (
    <View className="gap-4">
      <FormInput
        name="itemName"
        label={t("Coupon.itemName")}
        placeholder={t("Coupon.itemNamePlaceholder")}
        type="text"
        variant="compact"
        required
      />
      <FormInput
        name="itemBarcode"
        label={t("Coupon.itemBarcode")}
        placeholder={t("Coupon.itemBarcodePlaceholder")}
        type="text"
        variant="compact"
      />
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
      <CouponRewardPickerField
        name="rewardId"
        selectedRewardTitle={selectedRewardTitle}
        onOpenPicker={onOpenRewardPicker}
        onClearSelection={onClearRewardSelection}
        disabled={isRewardSelectionLocked}
      />
    </View>
  );
};
