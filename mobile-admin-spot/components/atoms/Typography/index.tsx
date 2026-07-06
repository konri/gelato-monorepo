import { Text, TextProps } from "react-native";

type TextVariant =
  | "text-56-bold"
  | "text-32-bold"
  | "text-24-bold"
  | "text-20-bold"
  | "text-18-black-spaced"
  | "text-18-black-spaced-lineHeight-22"
  | "text-18-bold"
  | "text-18-bold-tight"
  | "text-18-bold-spaced"
  | "text-18-semibold"
  | "text-18-semibold-spaced"
  | "text-18-regular"
  | "text-18-regular-spaced"
  | "text-16-bold"
  | "text-16-bold-spaced"
  | "text-16-semibold"
  | "text-16-medium-spaced"
  | "text-16-regular"
  | "text-16-regular-spaced"
  | "text-16-regular-spaced-lineHeight-19.2"
  | "text-15-regular"
  | "text-14-black-spaced"
  | "text-14-bold"
  | "text-14-bold-spaced"
  | "text-14-semibold"
  | "text-14-regular-spaced"
  | "text-13-bold-spaced"
  | "text-12-regular"
  | "text-12-semibold"
  | "text-12-bold"
  | "text-10-medium"
  | "text-9-bold"
  | "text-42-regular"
  | "text-32-semibold-38"
  | "text-49-regular-58"
  | "text-57-black-58"
  | "text-29-black-33"
  | "text-17-semibold-24"
  | "text-31-black-37"
  | "text-26-bold-24.7"
  | "text-20-bold-19"
  | "text-14-semibold-24"
  | "text-34-regular-44"
  | "text-34-black-44";

const variants: Record<TextVariant, string> = {
  "text-56-bold": "text-5xl font-bold",
  "text-32-bold": "text-3xl font-bold",
  "text-24-bold": "text-2xl font-bold",
  "text-20-bold": "text-xl font-bold",
  "text-18-black-spaced": "text-lg font-black",
  "text-18-black-spaced-lineHeight-22": "text-lg font-black",
  "text-18-bold": "text-lg font-bold",
  "text-18-bold-tight": "text-lg font-bold",
  "text-18-bold-spaced": "text-lg font-bold",
  "text-18-semibold": "text-lg font-semibold",
  "text-18-semibold-spaced": "text-lg font-semibold",
  "text-18-regular": "text-lg",
  "text-18-regular-spaced": "text-lg",
  "text-16-bold": "text-base font-bold",
  "text-16-bold-spaced": "text-base font-bold",
  "text-16-semibold": "text-base font-semibold",
  "text-16-medium-spaced": "text-base font-medium",
  "text-16-regular": "text-base",
  "text-16-regular-spaced": "text-base",
  "text-16-regular-spaced-lineHeight-19.2": "text-base",
  "text-15-regular": "text-sm",
  "text-14-black-spaced": "text-sm font-black",
  "text-14-bold": "text-sm font-bold",
  "text-14-bold-spaced": "text-sm font-bold",
  "text-14-semibold": "text-sm font-semibold",
  "text-14-regular-spaced": "text-sm",
  "text-13-bold-spaced": "text-sm font-bold",
  "text-12-regular": "text-xs",
  "text-12-semibold": "text-xs font-semibold",
  "text-12-bold": "text-xs font-bold",
  "text-10-medium": "text-[10px] font-medium",
  "text-9-bold": "text-[9px] font-bold",
  "text-42-regular": "text-4xl",
  "text-32-semibold-38": "text-3xl font-semibold",
  "text-49-regular-58": "font-normal",
  "text-57-black-58": "font-black",
  "text-29-black-33": "font-black",
  "text-17-semibold-24": "font-semibold",
  "text-31-black-37": "font-black",
  "text-26-bold-24.7": "font-bold",
  "text-20-bold-19": "font-bold",
  "text-14-semibold-24": "font-semibold",
  "text-34-regular-44": "font-normal",
  "text-34-black-44": "font-black",
};

export const variantStyles: Record<TextVariant, any> = {
  "text-56-bold": {
    fontFamily: "Urbanist",
    fontSize: 56,
    fontWeight: "700",
    lineHeight: 56,
  },
  "text-32-bold": {
    fontFamily: "Urbanist",
    fontSize: 32,
    lineHeight: 51.2,
  },
  "text-24-bold": {
    fontFamily: "Urbanist",
    fontSize: 24,
    lineHeight: 32,
  },
  "text-20-bold": {
    fontFamily: "Urbanist",
    fontSize: 20,
    lineHeight: 24,
  },
  "text-18-black-spaced": {
    fontFamily: "Urbanist",
    fontSize: 18,
    fontWeight: "900",
    lineHeight: 45,
    letterSpacing: 0.2,
  },
  "text-18-black-spaced-lineHeight-22": {
    fontFamily: "Urbanist",
    fontSize: 18,
    fontWeight: "900",
    lineHeight: 22,
    letterSpacing: 0.2,
  },
  "text-18-bold": {
    fontFamily: "Urbanist",
    fontSize: 18,
    lineHeight: 24,
  },
  "text-18-bold-tight": {
    fontFamily: "Urbanist",
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 18,
    letterSpacing: 0,
  },
  "text-18-bold-spaced": {
    fontFamily: "Urbanist",
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: 0.2,
  },
  "text-18-semibold": {
    fontFamily: "Urbanist",
    fontSize: 18,
    lineHeight: 24,
  },
  "text-18-semibold-spaced": {
    fontFamily: "Urbanist",
    fontSize: 18,
    lineHeight: 28.8,
    letterSpacing: 0.2,
  },
  "text-18-regular": {
    fontFamily: "Urbanist",
    fontSize: 18,
    lineHeight: 24,
  },
  "text-18-regular-spaced": {
    fontFamily: "Urbanist",
    fontSize: 18,
    lineHeight: 28.8,
    letterSpacing: 0.2,
  },
  "text-16-bold": {
    fontFamily: "Urbanist",
    fontSize: 16,
    lineHeight: 22,
  },
  "text-16-bold-spaced": {
    fontFamily: "Urbanist",
    fontSize: 16,
    lineHeight: 26,
    letterSpacing: 0.2,
  },
  "text-16-semibold": {
    fontFamily: "Urbanist",
    fontSize: 16,
    lineHeight: 24,
  },
  "text-16-medium-spaced": {
    fontFamily: "Urbanist",
    fontSize: 16,
    fontWeight: "500",
    lineHeight: 25.6,
    letterSpacing: 0.2,
  },
  "text-16-regular": {
    fontFamily: "Urbanist",
    fontSize: 16,
    lineHeight: 24,
  },
  "text-16-regular-spaced": {
    fontFamily: "Urbanist",
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: 0.2,
  },
  "text-16-regular-spaced-lineHeight-19.2": {
    fontFamily: "Urbanist",
    fontSize: 16,
    fontWeight: "400",
    lineHeight: 19.2,
    letterSpacing: 0.2,
  },
  "text-15-regular": {
    fontFamily: "Urbanist",
    fontSize: 15,
    fontWeight: "400",
    lineHeight: 22,
  },
  "text-14-black-spaced": {
    fontFamily: "Urbanist",
    fontSize: 14,
    fontWeight: "900",
    lineHeight: 22.4,
    letterSpacing: 0.2,
  },
  "text-14-bold": {
    fontFamily: "Urbanist",
    fontSize: 14,
    lineHeight: 22,
    fontWeight: "700",
    letterSpacing: 0,
  },
  "text-14-bold-spaced": {
    fontFamily: "Urbanist",
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 22.4,
    letterSpacing: 0.2,
  },
  "text-14-semibold": {
    fontFamily: "Urbanist",
    fontSize: 14,
    lineHeight: 22,
  },
  "text-14-regular-spaced": {
    fontFamily: "Urbanist",
    fontSize: 14,
    lineHeight: 16,
    letterSpacing: 0.2,
  },
  "text-13-bold-spaced": {
    fontFamily: "Urbanist",
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 15.6,
    letterSpacing: 0.2,
  },
  "text-12-regular": {
    fontFamily: "Urbanist",
    fontSize: 12,
    lineHeight: 14,
  },
  "text-12-semibold": {
    fontFamily: "Urbanist",
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 14,
    letterSpacing: 0.2,
  },
  "text-12-bold": {
    fontFamily: "Urbanist",
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 14,
    letterSpacing: 0.2,
  },
  "text-10-medium": {
    fontFamily: "Urbanist",
    fontSize: 10,
    fontWeight: "500",
    lineHeight: 16,
    letterSpacing: 0.2,
  },
  "text-9-bold": {
    fontFamily: "Urbanist",
    fontSize: 9,
    fontWeight: "700",
    lineHeight: 10,
    letterSpacing: 0.2,
  },
  "text-42-regular": {
    fontFamily: "Urbanist",
    fontSize: 42,
    fontWeight: "400",
    lineHeight: 42,
  },
  "text-32-semibold-38": {
    fontFamily: "Urbanist",
    fontSize: 32,
    fontWeight: "600",
    lineHeight: 38,
    letterSpacing: 0.2,
  },
  "text-49-regular-58": {
    fontFamily: "Urbanist",
    fontSize: 49,
    fontWeight: "400",
    lineHeight: 58,
    letterSpacing: 0,
  },
  "text-57-black-58": {
    fontFamily: "Urbanist",
    fontSize: 57,
    fontWeight: "900",
    lineHeight: 58,
    letterSpacing: 0,
  },
  "text-29-black-33": {
    fontFamily: "Urbanist",
    fontSize: 29,
    fontWeight: "900",
    lineHeight: 33,
  },
  "text-17-semibold-24": {
    fontFamily: "Urbanist",
    fontSize: 17,
    fontWeight: "600",
    lineHeight: 24,
  },
  "text-31-black-37": {
    fontFamily: "Urbanist",
    fontSize: 31,
    fontWeight: "900",
    lineHeight: 37,
  },
  "text-26-bold-24.7": {
    fontFamily: "Urbanist",
    fontSize: 26,
    fontWeight: "700",
    lineHeight: 24.7,
    letterSpacing: 0.2,
  },
  "text-20-bold-19": {
    fontFamily: "Urbanist",
    fontSize: 20,
    fontWeight: "700",
    lineHeight: 19,
    letterSpacing: 0.2,
  },
  "text-14-semibold-24": {
    fontFamily: "Urbanist",
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 24,
    letterSpacing: 0,
  },
  "text-34-regular-44": {
    fontFamily: "Urbanist",
    fontSize: 34,
    fontWeight: "400",
    lineHeight: 44,
    letterSpacing: 0,
  },
  "text-34-black-44": {
    fontFamily: "Urbanist",
    fontSize: 34,
    fontWeight: "900",
    lineHeight: 44,
    letterSpacing: 0,
  },
};

type Props = TextProps & {
  variant?: TextVariant;
  className?: string;
};

export function Typography({
  variant = "text-16-regular",
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
