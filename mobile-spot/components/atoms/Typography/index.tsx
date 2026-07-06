import { Text, TextProps } from "react-native";

type TextVariant =
  | "heading-32-bold"
  | "heading-34-bold"
  | "subtitle-light-spaced"
  | "body-base-bold-spaced"
  | "body-medium-regular-spaced"
  | "body-medium-regular"
  | "body-base-regular"
  | "body-base-small"
  | "body-base-medium-small"
  | "body-lg-bold"
  | "body-lg-semibold"
  | "body-lg-regular"
  | "body-2xl-bold"
  | "body-xl-bold"
  | "body-base-bold"
  | "body-base-semibold"
  | "body-base-regular-spaced"
  | "body-lg-bold-spaced"
  | "body-small-semibold"
  | "body-small-bold"
  | "body-small-regular-spaced"
  | "body-small-regular"
  | "body-very-small-regular"
  | "body-very-small-medium"
  | "body-regular-semibold"
  | "body-regular-bold"
  | "body-regular-spaced"
  | "body-lg-semibold-spaced"
  | "display-2xl-light"
  | "display-4xl-light"
  | "display-4xl-regular"
  | "display-4xl-bold"
  | "display-5xl-light"
  | "header-section-title"
  | "header-section-subtitle";

const variants: Record<TextVariant, string> = {
  "heading-32-bold": "font-bold",
  "heading-34-bold": "font-bold",
  "subtitle-light-spaced": "",
  "body-base-bold-spaced": "font-bold",
  "body-medium-regular-spaced": "",
  "body-medium-regular": "",
  "body-base-regular": "",
  "body-base-small": "font-bold",
  "body-base-medium-small": "",
  "body-lg-bold": "font-bold",
  "body-lg-semibold": "font-semibold",
  "body-lg-regular": "",
  "body-small-regular": "",
  "body-very-small-regular": "",
  "body-very-small-medium": "",
  "body-small-bold": "",
  "body-small-semibold": "font-semibold",
  "body-small-regular-spaced": "",
  "body-regular-semibold": "",
  "body-regular-bold": "",
  "body-regular-spaced": "",
  "body-2xl-bold": "font-bold",
  "body-xl-bold": "font-bold",
  "body-base-bold": "font-bold",
  "body-base-semibold": "font-semibold",
  "body-base-regular-spaced": "",
  "body-lg-bold-spaced": "font-bold",
  "body-lg-semibold-spaced": "font-semibold",
  "display-2xl-light": "font-light",
  "display-4xl-light": "font-light",
  "display-4xl-regular": "",
  "display-4xl-bold": "font-bold",
  "display-5xl-light": "font-light",
  "header-section-title": "font-bold",
  "header-section-subtitle": "font-semibold",
};

const variantStyles: Record<TextVariant, any> = {
  "header-section-title": {
    fontFamily: "Urbanist",
    fontSize: 18,
    fontWeight: "700",
  },
  "header-section-subtitle": {
    fontFamily: "Urbanist",
    fontSize: 12,
    fontWeight: "600",
  },
  "heading-32-bold": {
    fontFamily: "Urbanist",
    fontSize: 32,
    lineHeight: 51.2,
    fontWeight: "700",
  },
  "heading-34-bold": {
    fontFamily: "Urbanist",
    fontSize: 34,
    fontWeight: "700",
  },
  "subtitle-light-spaced": {
    fontFamily: "Urbanist",
    fontSize: 18,
    lineHeight: 28.8,
    letterSpacing: 0.2,
  },
  "body-base-bold-spaced": {
    fontFamily: "Urbanist",
    fontSize: 16,
    lineHeight: 26,
    letterSpacing: 0.2,
  },
  "body-medium-regular": {
    fontFamily: "Urbanist",
    fontSize: 13,
    lineHeight: 22.4,
    letterSpacing: 0.2,
  },
  "body-medium-regular-spaced": {
    fontFamily: "Urbanist",
    fontSize: 14,
    lineHeight: 22.4,
    letterSpacing: 0.2,
  },
  "body-base-regular": {
    fontFamily: "Urbanist",
    fontSize: 16,
    lineHeight: 24,
  },
  "body-base-small": {
    fontFamily: "Urbanist",
    fontSize: 12,
  },
  "body-base-medium-small": {
    fontFamily: "Urbanist",
    fontSize: 14,
    fontWeight: "900",
  },
  "body-lg-bold": {
    fontFamily: "Urbanist",
    fontSize: 18,
    lineHeight: 24,
  },
  "body-lg-semibold": {
    fontFamily: "Urbanist",
    fontSize: 18,
    lineHeight: 24,
  },
  "body-lg-regular": {
    fontFamily: "Urbanist",
    fontSize: 18,
    lineHeight: 24,
  },
  "body-small-regular": {
    fontFamily: "Urbanist",
    fontSize: 14,
    lineHeight: 22,
    fontWeight: "400",
  },
  "body-very-small-regular": {
    fontFamily: "Urbanist",
    fontSize: 12,
  },
  "body-very-small-medium": {
    fontFamily: "Urbanist",
    fontSize: 10,
    fontWeight: "500",
    lineHeight: 16,
    letterSpacing: 0.2,
  },
  "body-2xl-bold": {
    fontFamily: "Urbanist",
    fontSize: 24,
    lineHeight: 32,
  },
  "body-xl-bold": {
    fontFamily: "Urbanist",
    fontSize: 20,
    lineHeight: 24,
  },
  "body-base-bold": {
    fontFamily: "Urbanist",
    fontSize: 17,
    lineHeight: 22,
  },
  "body-base-semibold": {
    fontFamily: "Urbanist",
    fontSize: 16,
    lineHeight: 24,
  },
  "body-base-regular-spaced": {
    fontFamily: "Urbanist",
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: 0.2,
  },
  "body-lg-bold-spaced": {
    fontFamily: "Urbanist",
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: 0.2,
  },
  "body-small-semibold": {
    fontFamily: "Urbanist",
    fontSize: 14,
    lineHeight: 22,
  },
  "body-small-bold": {
    fontFamily: "Urbanist",
    fontSize: 14,
    fontWeight: "700"
  },
  "body-small-regular-spaced": {
    fontFamily: "Urbanist",
    fontSize: 14,
    lineHeight: 22.4,
    letterSpacing: 0.2,
  },
  "body-regular-semibold": {
    fontFamily: "Urbanist",
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "700"
  },
  "body-regular-bold": {
    fontFamily: "Urbanist",
    fontSize: 16,
    fontWeight: "700"
  },
  "body-regular-spaced": {
    fontFamily: "Urbanist",
    fontSize: 16,
    lineHeight: 22.4,
    letterSpacing: 0.2,
  },
  "body-lg-semibold-spaced": {
    fontFamily: "Urbanist",
    fontSize: 18,
    lineHeight: 28.8,
    letterSpacing: 0.2,
  },
  "display-2xl-light": {
    fontFamily: "Urbanist",
    fontSize: 22,
    fontWeight: "500",
  },
  "display-4xl-light": {
    fontFamily: "Urbanist",
    fontSize: 48,
    lineHeight: 52,
    fontWeight: "300",
  },
  "display-4xl-regular": {
    fontFamily: "Urbanist",
    fontSize: 48,
    lineHeight: 52,
    fontWeight: "500",
  },
  "display-4xl-bold": {
    fontFamily: "Urbanist",
    fontSize: 48,
    lineHeight: 52,
    fontWeight: "700",
  },
  "display-5xl-light": {
    fontFamily: "Urbanist",
    fontSize: 54,
    lineHeight: 60,
    fontWeight: "500",
  }
};

type Props = TextProps & {
  variant?: TextVariant;
  className?: string;
};

export function Typography({
  variant = "body-base-regular",
  className = "",
  style,
  ...props
}: Props) {
  return (
    <Text
      {...props}
      className={`${variants[variant]} ${className}`}
      style={[variantStyles[variant], style]}
    />
  );
}

