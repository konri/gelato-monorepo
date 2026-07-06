import { FormInput } from "@/components/atoms/FormInput";
import { InfoBanner } from "@/components/molecules/InfoBanner";
import { CouponRewardPickerField } from "@/components/organisms/CouponRewardPickerField";
import React from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import type { CouponFormData } from "@/utils/couponForm";
import type { RewardPickerFieldsProps } from "./types";

export const MultiBuyCouponFields = ({
  selectedRewardTitle,
  onOpenRewardPicker,
  onClearRewardSelection,
  isRewardSelectionLocked,
}: RewardPickerFieldsProps) => {
  const { t } = useTranslation();
  const form = useFormContext<CouponFormData>();
  const [buyQuantity, getQuantity] = useWatch({
    control: form.control,
    name: ["buyQuantity", "getQuantity"],
  });
  const buy = buyQuantity?.trim() || "X";
  const get = getQuantity?.trim() || "Y";

  return (
    <View className="gap-4">
      <FormInput
        name="buyQuantity"
        label={t("Coupon.buyQuantity")}
        helperText={t("Coupon.buyQuantityHelper")}
        placeholder="1"
        type="number"
        keyboardType="numeric"
        variant="compact"
        required
        min={0}
        integerOnly
      />
      <FormInput
        name="getQuantity"
        label={t("Coupon.getQuantity")}
        helperText={t("Coupon.getQuantityHelper")}
        placeholder="1"
        type="number"
        keyboardType="numeric"
        variant="compact"
        required
        min={0}
        integerOnly
      />
      <InfoBanner
        text={t("Coupon.multiBuyInfoBanner", {
          buy,
          get,
        })}
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
