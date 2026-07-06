import type { CustomValidation } from "@/components/atoms/FormInput/types";
import type { FieldPath, FieldValues } from "react-hook-form";

export type CouponRewardPickerFieldProps<TFieldValues extends FieldValues = FieldValues> = {
  name: FieldPath<TFieldValues>;
  selectedRewardTitle?: string;
  placeholderText?: string;
  label?: string;
  helperText?: string;
  clearSelectionText?: string;
  customValidation?: CustomValidation;
  onOpenPicker: () => void;
  onClearSelection: () => void;
  disabled?: boolean;
};
