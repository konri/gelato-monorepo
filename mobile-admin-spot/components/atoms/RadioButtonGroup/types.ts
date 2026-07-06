import { FieldPath, FieldValues } from "react-hook-form";
import { ReactNode } from "react";

export type RadioOption<T = number> = {
  label: string;
  value: T;
  preview?: ReactNode;
};

export type RadioButtonGroupProps<T = number> = {
  label: string;
  options: RadioOption<T>[];
  value?: T;
  onChange: (value: T) => void;
  error?: string;
  disabled?: boolean;
};

export type RadioButtonInputProps<
  TFieldValues extends FieldValues = FieldValues
> = {
  name: FieldPath<TFieldValues>;
  label: string;
  options: RadioOption<any>[];
  required?: boolean;
  disabled?: boolean;
};
