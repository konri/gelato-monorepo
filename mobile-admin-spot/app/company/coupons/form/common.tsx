import { CheckboxInput } from "@/components/atoms/Checkbox";
import { FormDatePicker } from "@/components/atoms/FormDatePicker";
import { FormInput } from "@/components/atoms/FormInput";
import { FormSelect } from "@/components/atoms/FormSelect";
import { CouponAssignUserField } from "@/components/molecules/CouponAssignUserField";
import { CouponExclusivityGroupsField } from "@/components/molecules/CouponExclusivityGroupsField";
import { ActionButtons } from "@/components/organisms/MultiStepForm/ActionButtons";
import {
  getAvailabilityTypeOptions,
  getDisplayTypeOptions,
  type CouponFormData,
} from "@/utils/couponForm";
import { useFormEditable } from "@/hooks/useFormEditable";
import { router } from "expo-router";
import React, { useEffect } from "react";
import { useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { useCouponWizardForm } from "./_layout";
import { CouponWizardStepContainer } from "./CouponWizardStepContainer";

export default function CouponCommonFieldsStepScreen() {
  const { t } = useTranslation();
  const { form, isSaving, isClaimLocked, isStoreOverrideEdit } = useCouponWizardForm();
  const canEditCoupons = useFormEditable();
  const [
    watchedAvailability,
    watchedIsStackable,
    watchedGlobalUsageLimit,
    watchedPointsCost,
    watchedUsesPerUserLimit,
  ] = useWatch({
    control: form.control,
    name: ["availability", "isStackable", "globalUsageLimit", "pointsCost", "usesPerUserLimit"],
  });
  const availability = watchedAvailability ?? "FREE";
  const isStackable = watchedIsStackable ?? false;
  const globalUsageLimit = watchedGlobalUsageLimit?.trim() ?? "";
  const availabilityOptions = getAvailabilityTypeOptions(t);
  const displayTypeOptions = getDisplayTypeOptions(t);

  useEffect(() => {
    if (availability !== "FREE") {
      return;
    }
    if (!watchedPointsCost) {
      return;
    }
    form.setValue("pointsCost", undefined, { shouldDirty: true });
  }, [availability, form, watchedPointsCost]);

  useEffect(() => {
    void form.trigger(["usesPerUserLimit", "globalUsageLimit"]);
  }, [form, watchedUsesPerUserLimit, watchedGlobalUsageLimit]);

  const handleNext = async () => {
    if (isStoreOverrideEdit) {
      const isValid = await form.trigger();
      if (isValid) {
        router.push("/company/coupons/form/preview");
      }
      return;
    }

    const fieldsToValidate: Array<keyof CouponFormData> = [
      "availability",
      "displayType",
      "validFrom",
      "validUntil",
      "usesPerUserLimit",
      "globalUsageLimit",
    ];

    if (availability === "POINTS") {
      fieldsToValidate.push("pointsCost");
    }

    const isValid = await form.trigger(fieldsToValidate);
    if (isValid) {
      router.push("/company/coupons/form/preview");
    }
  };

  return (
    <CouponWizardStepContainer>
      <View className="gap-4 pb-4">
        <FormSelect
          name="availability"
          label={t("Coupon.availability")}
          placeholder={t("Coupon.selectAvailability")}
          options={availabilityOptions}
          editable={isClaimLocked ? false : undefined}
          required
          variant="compact"
        />

        {availability === "POINTS" && (
          <FormInput
            name="pointsCost"
            label={t("Coupon.pointsCost")}
            placeholder="0"
            type="number"
            keyboardType="numeric"
            variant="compact"
            suffix={t("Coupon.points")}
            required
            min={1}
            integerOnly
            editable={isClaimLocked ? false : undefined}
          />
        )}

        <FormSelect
          name="displayType"
          label={t("Coupon.displayType")}
          placeholder={t("Coupon.selectDisplayType")}
          options={displayTypeOptions}
          editable={isClaimLocked ? false : undefined}
          required
          variant="compact"
        />

        <CheckboxInput
          name="isActive"
          label={t("Coupon.couponActive")}
          editable={isClaimLocked ? false : undefined}
        />

        <View className="flex-row gap-4">
          <View className="flex-1">
            <FormDatePicker
              name="validFrom"
              label={t("Coupon.validFrom")}
              placeholder={t("Coupon.validFromPlaceholder")}
              required
              customValidation={{
                validate: (value) => {
                  if (!value) {
                    return t("Validation.fieldRequired");
                  }

                  const validUntil = form.getValues("validUntil");
                  if (validUntil && new Date(value) > new Date(validUntil)) {
                    return t("Coupon.validUntilAfterStart");
                  }

                  return true;
                },
              }}
            />
          </View>
          <View className="flex-1">
            <FormDatePicker
              name="validUntil"
              label={t("Coupon.validUntil")}
              placeholder={t("Coupon.validUntilPlaceholder")}
              required
              customValidation={{
                validate: (value) => {
                  if (!value) {
                    return t("Validation.fieldRequired");
                  }

                  const validFrom = form.getValues("validFrom");
                  if (validFrom && new Date(value) < new Date(validFrom)) {
                    return t("Coupon.validUntilAfterStart");
                  }

                  return true;
                },
              }}
            />
          </View>
        </View>

        <FormInput
          name="usesPerUserLimit"
          label={t("Coupon.usesPerUserLimit")}
          placeholder="0"
          type="number"
          keyboardType="numeric"
          variant="compact"
          helperText={t("Coupon.usesPerUserLimitHelper")}
          min={0}
          integerOnly
          editable={isClaimLocked ? false : undefined}
          customValidation={{
            validate: (value) => {
              const normalizedValue = value.trim();
              if (!normalizedValue || !globalUsageLimit) {
                return true;
              }
              const usesPerUserValue = Number(normalizedValue);
              const globalLimitValue = Number(globalUsageLimit);
              if (
                Number.isNaN(usesPerUserValue) ||
                Number.isNaN(globalLimitValue) ||
                usesPerUserValue <= globalLimitValue
              ) {
                return true;
              }
              return t("Validation.maxValue", { max: globalLimitValue });
            },
            message: t("Validation.invalidData"),
          }}
        />

        <FormInput
          name="globalUsageLimit"
          label={t("Coupon.globalUsageLimit")}
          placeholder="0"
          type="number"
          keyboardType="numeric"
          variant="compact"
          helperText={t("Coupon.globalUsageLimitHelper")}
          min={0}
          integerOnly
          editable={isClaimLocked ? false : undefined}
          customValidation={{
            validate: (value) => {
              const normalizedGlobal = value.trim();
              const normalizedPerUser = form.getValues("usesPerUserLimit")?.trim() ?? "";

              if (!normalizedGlobal || !normalizedPerUser) {
                return true;
              }

              const globalLimitValue = Number(normalizedGlobal);
              const usesPerUserValue = Number(normalizedPerUser);
              if (
                Number.isNaN(globalLimitValue) ||
                Number.isNaN(usesPerUserValue) ||
                usesPerUserValue <= globalLimitValue
              ) {
                return true;
              }

              return t("Validation.minValue", { min: usesPerUserValue });
            },
            message: t("Validation.invalidData"),
          }}
        />

        <CouponAssignUserField
          disabled={isSaving || !canEditCoupons || isClaimLocked}
        />

        <CheckboxInput
          name="isStackable"
          label={t("Coupon.isStackable")}
          editable={isClaimLocked ? false : undefined}
        />

        {isStackable && (
          <CouponExclusivityGroupsField
            disabled={isSaving || isClaimLocked || !canEditCoupons}
          />
        )}

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
