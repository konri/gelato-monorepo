import { Typography } from "@/components/atoms/Typography";
import { useResolvedEditable } from "@/hooks/useFormEditable";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Controller, useFormContext } from "react-hook-form";
import type { FieldValues } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import type { FormDatePickerProps } from "./types";
import { parseFieldDate, toLocalYmd } from "./utils";

const styles = StyleSheet.create({
  calendarIcon: { marginRight: 12 },
});

export const FormDatePicker = <
  TFieldValues extends FieldValues = FieldValues,
>({
  name,
  label,
  placeholder,
  variant = "default",
  minimumDate,
  maximumDate,
  minAgeYears,
  maxAgeYears,
  disabled,
  required = false,
  confirmValue = "yyyy-mm-dd-local",
  customValidation,
}: FormDatePickerProps<TFieldValues>) => {
  const { t } = useTranslation();
  const { control } = useFormContext<TFieldValues>();
  const [isVisible, setIsVisible] = useState(false);
  const editableDefault = useResolvedEditable();
  const resolvedDisabled = disabled ?? !editableDefault;
  const now = new Date();

  const derivedMinimumDate =
    minimumDate ??
    (typeof maxAgeYears === "number"
      ? new Date(now.getFullYear() - maxAgeYears, now.getMonth(), now.getDate())
      : undefined);

  const derivedMaximumDate =
    maximumDate ??
    (typeof minAgeYears === "number"
      ? new Date(now.getFullYear() - minAgeYears, now.getMonth(), now.getDate())
      : undefined);

  return (
    <Controller
      control={control}
      name={name}
      rules={{
        validate: (value: string | undefined) => {
          if (required && !value) {
            return t("Validation.fieldRequired");
          }

          if (customValidation) {
            return customValidation.validate(value);
          }

          return true;
        },
      }}
      render={({ field: { value, onChange }, fieldState: { error } }) => {
        const dateValue = parseFieldDate(value);
        const displayValue =
          dateValue?.toLocaleDateString() || placeholder || "";

        const handleConfirm = (date: Date) => {
          onChange(
            confirmValue === "yyyy-mm-dd-local"
              ? toLocalYmd(date)
              : date.toISOString(),
          );
          setIsVisible(false);
        };

        const handleCancel = () => {
          setIsVisible(false);
        };

        const isPrimary = variant === "primary";

        const pressableClasses = isPrimary
          ? `rounded-32px px-5 py-4 flex-row items-center justify-center border ${
              resolvedDisabled
                ? "bg-gray-100 border-gray-100"
                : error
                  ? "bg-white border-red-500"
                  : "bg-white border-gray-200"
            }`
          : `rounded-2xl bg-white px-4 py-3 justify-center ${
              error ? "border border-red-500" : ""
            }`;

        return (
          <View className={isPrimary ? "" : "gap-2"}>
            {isPrimary ? (
              <Typography
                variant="text-18-semibold"
                className="text-gray-900 mb-2"
              >
                {label}
              </Typography>
            ) : (
              <Typography
                variant="text-14-regular-spaced"
                className="text-black"
              >
                {label}
              </Typography>
            )}
            <Pressable
              onPress={() => {
                if (resolvedDisabled) {
                  return;
                }
                setIsVisible(true);
              }}
              disabled={resolvedDisabled}
              className={pressableClasses}
            >
              {isPrimary ? (
                <>
                  <Ionicons
                    name="calendar-outline"
                    size={20}
                    color="#9E9E9E"
                    style={styles.calendarIcon}
                  />
                  <Typography
                    variant="text-18-regular"
                    className={
                      dateValue
                        ? "flex-1 text-gray-900"
                        : "flex-1 text-gray-400"
                    }
                  >
                    {displayValue}
                  </Typography>
                </>
              ) : (
                <Typography
                  variant="text-14-regular-spaced"
                  className={dateValue ? "text-black" : "text-gray-550"}
                >
                  {displayValue}
                </Typography>
              )}
            </Pressable>
            {error && (
              <Typography
                variant="text-12-regular"
                className={
                  isPrimary ? "text-red-500 mt-1" : "text-red-500"
                }
              >
                {error.message}
              </Typography>
            )}

            <DateTimePickerModal
              isVisible={isVisible}
              mode="date"
              date={dateValue || new Date()}
              minimumDate={derivedMinimumDate}
              maximumDate={derivedMaximumDate}
              onConfirm={handleConfirm}
              onCancel={handleCancel}
            />
          </View>
        );
      }}
    />
  );
};
