import { Button } from "@/components/atoms/Button";
import type { ComponentProps, ReactNode } from "react";
import { FieldValues, UseFormReturn } from "react-hook-form";
import { DimensionValue } from "react-native";

type ButtonSize = NonNullable<ComponentProps<typeof Button>["size"]>;

export type ErrorHandler<TFieldValues extends FieldValues = FieldValues> = (
  error: unknown,
  form: UseFormReturn<TFieldValues>,
) => boolean;

export type FormProps<TFieldValues extends FieldValues = FieldValues> = {
  form: UseFormReturn<TFieldValues>;
  children: ReactNode;
  onSubmit: (data: TFieldValues) => Promise<void> | void;
  successRoute?: string;
  onError?: ErrorHandler<TFieldValues>;
  submitButtonText?: string;
  submitButtonSize?: ButtonSize;
  submitButtonStyle?: {
    width?: DimensionValue;
    height?: number;
  };
  className?: string;
};
