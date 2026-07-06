import { Select } from "@/components/atoms/Select";
import { useResolvedEditable } from "@/hooks/useFormEditable";
import type { Category } from "@/shared/api-client/src/graphql/queries/categories";
import React from "react";
import { Controller, useFormContext } from "react-hook-form";
import type { FieldValues, Path } from "react-hook-form";
import { useTranslation } from "react-i18next";

type CategorySelectProps<TFieldValues extends FieldValues = FieldValues> = {
  name: Path<TFieldValues>;
  label: string;
  categories: Category[];
  required?: boolean;
  editable?: boolean;
};

export const CategorySelect = <TFieldValues extends FieldValues = FieldValues>({
  name,
  label,
  categories,
  required = false,
  editable,
}: CategorySelectProps<TFieldValues>) => {
  const { t } = useTranslation();
  const { control, formState } = useFormContext<TFieldValues>();
  const resolvedEditable = useResolvedEditable(editable) && !formState.isSubmitting;

  const options = categories.map((category) => ({
    label: t(`Merchant.categories.${category.slug}`, {
      defaultValue: category.name,
    }),
    value: category.id,
  }));

  return (
    <Controller
      control={control}
      name={name}
      rules={{
        validate: (value: string) => {
          if (required && !value) {
            return t("Validation.fieldRequired");
          }
          return true;
        },
      }}
      render={({ field: { onChange, value }, fieldState: { error } }) => (
        <Select
          label={label}
          placeholder={t("Merchant.category")}
          value={value}
          options={options}
          onChange={onChange}
          error={error?.message}
          editable={resolvedEditable}
          variant="compact"
        />
      )}
    />
  );
};
