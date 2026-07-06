import { Checkbox } from "@/components/atoms/Checkbox";
import { Typography } from "@/components/atoms/Typography";
import type { CouponFormData } from "@/utils/couponForm";
import { getExclusivityGroupOptions } from "@/utils/couponForm";
import React from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import type { CouponExclusivityGroupsFieldProps } from "./types";

export const CouponExclusivityGroupsField = ({
  disabled = false,
}: CouponExclusivityGroupsFieldProps) => {
  const { t } = useTranslation();
  const form = useFormContext<CouponFormData>();
  const selectedGroups = useWatch({
    control: form.control,
    name: "exclusivityGroups",
  });

  const options = getExclusivityGroupOptions(t);
  const groups = selectedGroups ?? [];

  return (
    <View className="gap-2.5">
      <Typography variant="text-14-bold" className="text-black">
        {t("Coupon.exclusivityGroups")}
      </Typography>
      <Typography variant="text-12-regular" className="text-black-47">
        {t("Coupon.exclusivityGroupsHelper")}
      </Typography>
      <View className="rounded-2xl bg-white px-4 py-3 gap-1">
        {options.map((option) => {
          const checked = groups.includes(option.value);
          return (
            <Checkbox
              key={option.value}
              checked={checked}
              label={option.label}
              disabled={disabled}
              onToggle={() => {
                const nextGroups = checked
                  ? groups.filter((group) => group !== option.value)
                  : [...groups, option.value];
                form.setValue("exclusivityGroups", nextGroups, { shouldDirty: true });
              }}
            />
          );
        })}
      </View>
    </View>
  );
};
