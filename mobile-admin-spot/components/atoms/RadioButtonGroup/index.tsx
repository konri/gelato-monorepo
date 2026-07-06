import { Typography } from "@/components/atoms/Typography";
import React from "react";
import { Controller, FieldValues, useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, View } from "react-native";
import { twMerge } from "tailwind-merge";
import {
  RadioButtonGroupProps,
  RadioButtonInputProps,
} from "./types";

export const RadioButtonGroup = <T = number,>({
  label,
  options,
  value,
  onChange,
  error,
  disabled = false,
}: RadioButtonGroupProps<T>) => {
  return (
    <View className="gap-4">
      <Typography variant="text-14-regular-spaced" className="text-black">
        {label}
      </Typography>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
      >
        <View className="flex-row gap-2">
          {options.map((option) => {
            const isSelected = value === option.value;
            return (
              <Pressable
                key={String(option.value)}
                onPress={() => !disabled && onChange(option.value)}
                disabled={disabled}
                className={twMerge("gap-2.5", disabled && "opacity-50")}
              >
                <Typography
                  variant="text-14-regular-spaced"
                  className="text-black"
                >
                  {option.label}
                </Typography>
                {option.preview ? (
                  <View
                    className={twMerge(
                      "w-20 h-14 bg-white rounded-2xl border items-center justify-center",
                      isSelected
                        ? "border-blue-900"
                        : "border-gray-200-light"
                    )}
                  >
                    {option.preview}
                  </View>
                ) : (
                  <View
                    className={twMerge(
                      "w-5 h-5 rounded-full border-2 items-center justify-center",
                      isSelected
                        ? "border-blue-900 bg-blue-900"
                        : "border-gray-400"
                    )}
                  >
                    {isSelected && (
                      <View className="w-2 h-2 rounded-full bg-white" />
                    )}
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
      {error && (
        <Typography variant="text-12-regular" className="text-red-500">
          {error}
        </Typography>
      )}
    </View>
  );
};

export const RadioButtonInput = <
  TFieldValues extends FieldValues = FieldValues
>({
  name,
  label,
  options,
  required = false,
  disabled = false,
}: RadioButtonInputProps<TFieldValues>) => {
  const { control, formState } = useFormContext<TFieldValues>();
  const { t } = useTranslation();

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
      shouldUnregister={false}
      render={({ field: { onChange, value }, fieldState: { error } }) => (
        <RadioButtonGroup
          label={label}
          options={options}
          value={value}
          onChange={onChange}
          error={error?.message}
          disabled={disabled || formState.isSubmitting}
        />
      )}
    />
  );
};
