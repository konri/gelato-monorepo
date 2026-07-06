import { ReactNode } from "react";
import { FieldPath, FieldValues, UseFormReturn } from "react-hook-form";

export type FormFieldConfig<TFieldValues extends FieldValues = FieldValues> = {
  name: FieldPath<TFieldValues>;
  component: ReactNode;
  span?: 1 | 2;
};

export type FormStep<TStepData extends FieldValues = FieldValues> = {
  stepNumber: number;
  title: string;
  subtitle?: string;
  form: UseFormReturn<TStepData>;
  fields: FormFieldConfig<TStepData>[];
  validate?: (form: UseFormReturn<TStepData>) => Promise<boolean> | boolean;
  onSubmit?: (data: TStepData) => Promise<void> | void;
  submitButtonText?: string;
};

export type MultiStepFormProps = {
  title?: string;
  steps: FormStep<FieldValues>[];
  onSubmit?: () => Promise<void> | void;
  onCancel?: () => void;
  submitButtonText?: string;
  cancelButtonText?: string;
  currentStep?: number;
  onStepChange?: (step: number) => void;
  initialStep?: number;
  initialCompletedSteps?: Set<number>;
};
