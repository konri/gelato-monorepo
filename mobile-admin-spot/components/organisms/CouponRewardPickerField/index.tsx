import { Typography } from "@/components/atoms/Typography";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Controller, FieldValues, useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";
import { twMerge } from "tailwind-merge";
import type { CouponRewardPickerFieldProps } from "./types";

export const CouponRewardPickerField = <TFieldValues extends FieldValues = FieldValues>({
  name,
  selectedRewardTitle,
  placeholderText,
  label,
  helperText,
  clearSelectionText,
  customValidation,
  onOpenPicker,
  onClearSelection,
  disabled = false,
}: CouponRewardPickerFieldProps<TFieldValues>) => {
  const { t } = useTranslation();
  const { control } = useFormContext<TFieldValues>();
  const displayLabel = label ?? t("Coupon.reward");
  const displayHelperText = helperText ?? t("Coupon.rewardPickerHelper");
  const displayPlaceholderText = placeholderText ?? t("Coupon.selectReward");
  const displayClearSelectionText = clearSelectionText ?? t("Coupon.clearRewardSelection");

  return (
    <Controller
      control={control}
      name={name}
      shouldUnregister={false}
      rules={{
        validate: (value) => {
          if (!customValidation) {
            return true;
          }
          const normalizedValue = typeof value === "string" ? value : "";
          return customValidation.validate(normalizedValue);
        },
      }}
      render={({ field: { value }, fieldState: { error } }) => {
        const normalizedValue = typeof value === "string" ? value : "";
        const hasSelectedReward = normalizedValue.length > 0;

        return (
          <View className="gap-3">
            {!!displayLabel && (
              <Typography variant="text-14-bold" className="text-black">
                {displayLabel}
              </Typography>
            )}
            {!!displayHelperText && (
              <Typography variant="text-12-regular" className="text-black-47">
                {displayHelperText}
              </Typography>
            )}
            <Pressable
              onPress={onOpenPicker}
              disabled={disabled}
              className="rounded-2xl bg-white flex-row items-center px-4 py-2"
            >
              <Typography
                variant="text-14-regular-spaced"
                className={twMerge(
                  "flex-1",
                  hasSelectedReward ? "text-black" : "text-black-47",
                )}
              >
                {selectedRewardTitle ?? displayPlaceholderText}
              </Typography>
              <Ionicons name="chevron-down-outline" size={20} color="#212121" />
            </Pressable>
            {!!error?.message && (
              <Typography variant="text-12-regular" className="text-red-500">
                {error.message}
              </Typography>
            )}
            {hasSelectedReward && (
              <Pressable onPress={onClearSelection} disabled={disabled}>
                <Typography variant="text-12-regular" className="text-blue-900">
                  {displayClearSelectionText}
                </Typography>
              </Pressable>
            )}
          </View>
        );
      }}
    />
  );
};
