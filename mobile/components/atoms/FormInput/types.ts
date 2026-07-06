import { TextInputProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Control, FieldPath, FieldValues } from 'react-hook-form';

export type FormInputType = 'email' | 'password' | 'text' | 'phone' | 'referralCode' | 'name';

export type CustomValidation = {
  validate: (value: string) => boolean;
  message: string;
};

export type FormInputProps<TFieldValues extends FieldValues = FieldValues> = {
  name: FieldPath<TFieldValues>;
  label: string;
  placeholder: string;
  type?: FormInputType;
  required?: boolean;
  iconName?: keyof typeof Ionicons.glyphMap;
  isPassword?: boolean;
  prefix?: string;
  onChangeText?: (text: string) => void;
  customValidation?: CustomValidation;
} & Omit<TextInputProps, 'value' | 'onChangeText'>;
