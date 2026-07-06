import { ReactNode } from "react";
import { FieldValues, UseFormReturn } from "react-hook-form";
import { DimensionValue } from "react-native";

export type ErrorHandler = (
  error: unknown,
  form: UseFormReturn<any>
) => boolean;

export type FormProps<TFieldValues extends FieldValues = FieldValues> = {
  form: UseFormReturn<TFieldValues>;
  children: ReactNode;
  onSubmit: (data: TFieldValues) => Promise<void> | void;
  successRoute?: string;
  onError?: ErrorHandler;
  submitButtonText?: string;
  submitButtonStyle?: {
    width?: DimensionValue;
    height?: number;
  };
  className?: string;
};
