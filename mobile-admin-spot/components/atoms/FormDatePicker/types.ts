import type { FieldValues, Path } from "react-hook-form";

export type FormDatePickerConfirmValue = "iso" | "yyyy-mm-dd-local";

export type FormDatePickerVariant = "default" | "primary";

export type FormDatePickerProps<TFieldValues extends FieldValues> = {
  name: Path<TFieldValues>;
  label: string;
  placeholder?: string;
  variant?: FormDatePickerVariant;
  minimumDate?: Date;
  maximumDate?: Date;
  minAgeYears?: number;
  maxAgeYears?: number;
  disabled?: boolean;
  required?: boolean;
  confirmValue?: FormDatePickerConfirmValue;
  customValidation?: {
    validate: (value: string | undefined) => boolean | string;
  };
};

