import { InputField } from "@/components/InputField";
import { useResolvedEditable } from "@/hooks/useFormEditable";
import { formatPolishPhoneInput } from "@/utils/validators";
import React, { useMemo } from "react";
import { Controller, FieldValues, useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { FormInputProps } from "./types";
import { getValidationForType } from "./validation";

export const FormInput = <TFieldValues extends FieldValues = FieldValues>({
  name,
  label,
  placeholder,
  type,
  required = false,
  min,
  max,
  integerOnly = false,
  onChangeText: customOnChangeText,
  customValidation,
  labelBold,
  autoTrim,
  suffix,
  helperText,
  editable,
  ...textInputProps
}: FormInputProps<TFieldValues>) => {
  const { t } = useTranslation();
  const { control, formState } = useFormContext<TFieldValues>();
  const resolvedEditable = useResolvedEditable(editable) && !formState.isSubmitting;

  const keyboardType = textInputProps.keyboardType;
  const isPasswordField = textInputProps.isPassword === true;

  const shouldAutoTrim =
    autoTrim !== undefined
      ? autoTrim
      : type !== "password" &&
          type !== "number" &&
          type !== "phone" &&
          !isPasswordField;

  const validationRules = useMemo(
    () => ({
      validate: (value: string | undefined) => {
        const normalizedValue = value?.trim() ?? "";

        const typeValidation = getValidationForType(type, t);
        if (typeValidation) {
          const typeValidationResult = typeValidation(value ?? "", required);
          if (typeValidationResult !== true) {
            return typeValidationResult;
          }
        }

        if (required && !normalizedValue) {
          return t("Validation.fieldRequired");
        }

        const isNumeric = type === "number" || keyboardType === "numeric";
        if (isNumeric && normalizedValue) {
          const numValue = Number(normalizedValue);
          if (Number.isNaN(numValue)) {
            return t("Validation.invalidData");
          }
          if (integerOnly && !Number.isInteger(numValue)) {
            return t("Validation.invalidData");
          }
          if (min !== undefined && numValue < min) {
            return t("Validation.minValue", { min });
          }
          if (max !== undefined && numValue > max) {
            return t("Validation.maxValue", { max });
          }
        }

        if (customValidation) {
          return customValidation.validate(value ?? "");
        }

        return true;
      },
    }),
    [
      type,
      required,
      min,
      max,
      integerOnly,
      customValidation,
      keyboardType,
      t,
    ],
  );

  return (
    <Controller
      control={control}
      name={name}
      rules={validationRules}
      shouldUnregister={false}
      render={({
        field: { onChange, onBlur, value },
        fieldState: { error, isTouched },
      }) => {
        const handleBlur = () => {
          if (shouldAutoTrim && value) {
            const trimmed = value.trim();
            if (trimmed !== value) {
              onChange(trimmed);
            }
          }
          onBlur();
        };

        const displayValue =
          type === "phone"
            ? formatPolishPhoneInput(value ?? "")
            : (value ?? "");

        const handleChangeText = (text: string) => {
          const next = type === "phone" ? formatPolishPhoneInput(text) : text;
          if (customOnChangeText) {
            customOnChangeText(next);
          }
          onChange(next);
        };

        return (
          <InputField
            label={label}
            placeholder={placeholder}
            value={displayValue}
            onChangeText={handleChangeText}
            onBlur={handleBlur}
            error={error?.message}
            labelBold={labelBold}
            suffix={suffix}
            helperText={helperText}
            {...textInputProps}
            editable={resolvedEditable}
          />
        );
      }}
    />
  );
};
