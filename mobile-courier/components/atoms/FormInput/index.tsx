import { InputField } from "@/components/InputField";
import React from "react";
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
  iconName,
  isPassword = false,
  prefix,
  onChangeText: customOnChangeText,
  customValidation,
  ...textInputProps
}: FormInputProps<TFieldValues>) => {
  const { t } = useTranslation();
  const { control, formState } = useFormContext<TFieldValues>();

  const validationRules = {
    validate: (value: string) => {
      if (customValidation) {
        return customValidation.validate(value)
          ? true
          : customValidation.message;
      }

      const typeValidation = getValidationForType(type, t);
      if (typeValidation) {
        return typeValidation(value, required);
      }

      if (required && !value) {
        return t("Validation.fieldRequired");
      }

      return true;
    },
  };

  return (
    <Controller
      control={control}
      name={name}
      rules={validationRules}
      render={({
        field: { onChange, onBlur, value },
        fieldState: { error, isTouched },
      }) => (
        <InputField
          label={label}
          placeholder={placeholder}
          value={value || ""}
          onChangeText={(text) => {
            // If custom handler exists, use its result, otherwise use raw text
            const processedText = customOnChangeText ? customOnChangeText(text) || text : text;
            onChange(processedText);
          }}
          onBlur={onBlur}
          iconName={iconName}
          isPassword={isPassword}
          prefix={prefix}
          error={error?.message}
          editable={!formState.isSubmitting}
          {...textInputProps}
        />
      )}
    />
  );
};
