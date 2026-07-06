import { Typography } from "@/components/atoms/Typography";
import { useResolvedEditable } from "@/hooks/useFormEditable";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Controller, FieldValues, useFormContext } from "react-hook-form";
import { Pressable, View } from "react-native";
import type { CheckboxInputProps, CheckboxProps } from "./types";

export const Checkbox = ({
  checked,
  label,
  onToggle,
  disabled = false,
  variant = "default",
  accessibilityLabel,
}: CheckboxProps) => {
  const isCellVariant = variant === "cell";

  return (
    <Pressable
      onPress={onToggle}
      disabled={disabled}
      className={isCellVariant ? "items-center justify-center" : "flex-row items-center gap-3 mt-1"}
      accessibilityLabel={accessibilityLabel}
    >
      <View
        className={`w-6 h-6 rounded-lg border items-center justify-center ${
          checked
            ? "bg-blue-900 border-blue-900"
            : "border-blue-900 bg-gray-50-light"
        } ${disabled ? "opacity-50" : ""}`}
      >
        {checked && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
      </View>
      {label && !isCellVariant ? (
        <Typography
          variant="text-14-regular-spaced"
          className="flex-1 text-black"
        >
          {label}
        </Typography>
      ) : null}
    </Pressable>
  );
};

export const CheckboxInput = <
  TFieldValues extends FieldValues = FieldValues,
>({
  name,
  label,
  required = false,
  editable,
}: CheckboxInputProps<TFieldValues>) => {
  const { control, formState } = useFormContext<TFieldValues>();
  const resolvedEditable = useResolvedEditable(editable) && !formState.isSubmitting;

  return (
    <Controller
      control={control}
      name={name}
      rules={{
        validate: (value: boolean) => {
          if (!required) {
            return true;
          }
          return value || "Validation.fieldRequired";
        },
      }}
      render={({ field: { value, onChange }, fieldState: { error } }) => (
        <View className="gap-1">
          <Checkbox
            checked={!!value}
            label={label}
            onToggle={() => onChange(!value)}
            disabled={!resolvedEditable}
          />
          {error?.message && (
            <Typography
              variant="text-12-regular"
              className="text-red-500 ml-9"
            >
              {error.message}
            </Typography>
          )}
        </View>
      )}
    />
  );
};
