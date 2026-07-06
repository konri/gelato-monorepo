import { Ionicons } from "@expo/vector-icons";
import { FieldPath, FieldValues } from "react-hook-form";
import { TextInputProps } from "react-native";

export type FormInputType =
  | "email"
  | "password"
  | "text"
  | "phone"
  | "referralCode"
  | "name"
  | "url"
  | "number";

export type CustomValidation = {
  validate: (value: string) => boolean | string;
  message: string;
};

export type FormInputProps<TFieldValues extends FieldValues = FieldValues> = {
  name: FieldPath<TFieldValues>;
  label: string;
  placeholder: string;
  type?: FormInputType;
  required?: boolean;
  min?: number;
  max?: number;
  integerOnly?: boolean;
  iconName?: keyof typeof Ionicons.glyphMap;
  leftIcon?: React.ReactNode;
  isPassword?: boolean;
  prefix?: string;
  onChangeText?: (text: string) => void;
  customValidation?: CustomValidation;
  rightIcon?: React.ReactNode;
  variant?: "primary" | "compact";
  labelBold?: boolean;
  autoTrim?: boolean;
  suffix?: string;
  helperText?: string;
} & Omit<TextInputProps, "value" | "onChangeText">;
