import type { DimensionValue } from "react-native";

export type FooterButtonVariant =
  | "primary"
  | "secondary"
  | "social"
  | "outline"
  | "outlineSecondary";

export type FooterButtonSize = "sm" | "md" | "lg";

export type FooterButtonConfig = {
  title: string;
  onPress: () => void;
  variant?: FooterButtonVariant;
  size?: FooterButtonSize;
  width?: DimensionValue;
  disabled?: boolean;
};

export type TwoButtonFooterProps = {
  leftButton?: FooterButtonConfig;
  rightButton?: FooterButtonConfig;
  containerClassName?: string;
};

