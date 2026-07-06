import { FieldPath, FieldValues } from "react-hook-form";

export type SelectOption<T = string> = {
  label: string;
  value: T;
};

export type FormSelectProps<TFieldValues extends FieldValues = FieldValues> = {
  name: FieldPath<TFieldValues>;
  label: string;
  placeholder: string;
  options: SelectOption[];
  onValueChange?: (value: SelectOption["value"]) => void;
  required?: boolean;
  variant?: "primary" | "compact";
  labelBold?: boolean;
  editable?: boolean;
  helperText?: string;
};
