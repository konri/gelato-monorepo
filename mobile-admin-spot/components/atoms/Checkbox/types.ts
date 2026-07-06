import type { FieldPath, FieldValues } from "react-hook-form";

export type CheckboxProps = {
  checked: boolean;
  label?: string;
  onToggle: () => void;
  disabled?: boolean;
  variant?: "default" | "cell";
  accessibilityLabel?: string;
};

export type CheckboxInputProps<
  TFieldValues extends FieldValues = FieldValues,
> = {
  name: FieldPath<TFieldValues>;
  label: string;
  required?: boolean;
  editable?: boolean;
};
