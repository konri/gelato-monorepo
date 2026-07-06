import { Select } from "@/components/atoms/Select";
import { useResolvedEditable } from "@/hooks/useFormEditable";
import React from "react";
import { Controller, FieldValues, useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { FormSelectProps } from "./types";

export const FormSelect = <TFieldValues extends FieldValues = FieldValues>({
  name,
  label,
  placeholder,
  options,
  onValueChange,
  required = false,
  variant = "compact",
  labelBold = true,
  editable,
  helperText,
}: FormSelectProps<TFieldValues>) => {
  const { control, formState } = useFormContext<TFieldValues>();
  const { t } = useTranslation();
  const resolvedEditable = useResolvedEditable(editable) && !formState.isSubmitting;

  return (
    <Controller
      control={control}
      name={name}
      rules={{
        validate: (value) => {
          if (required && (value === undefined || value === null || value === "")) {
            return t("Validation.fieldRequired");
          }
          return true;
        },
      }}
      render={({ field: { onChange, value }, fieldState: { error } }) => (
        <Select
          label={label}
          placeholder={placeholder}
          value={value}
          options={options}
          onChange={(nextValue) => {
            onChange(nextValue);
            onValueChange?.(nextValue);
          }}
          error={error?.message}
          helperText={helperText}
          editable={resolvedEditable}
          variant={variant}
          labelBold={labelBold}
        />
      )}
    />
  );
};
