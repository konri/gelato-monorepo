import { Typography } from "@/components/atoms/Typography";
import React from "react";
import { DimensionValue, Pressable, View } from "react-native";

type ButtonVariant =
  | "primary"
  | "secondary"
  | "social"
  | "outline"
  | "outlineSecondary";

type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  width?: DimensionValue;
  height?: number;
  disabled?: boolean;
  className?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
};

export const Button = ({
  title,
  onPress,
  variant = "primary",
  size = "md",
  width = "100%",
  height,
  disabled = false,
  className = "",
  leftIcon,
  rightIcon,
}: ButtonProps) => {
  const sizeMap: Record<ButtonSize, { height: number; paddingVertical: number; paddingHorizontal: number; textVariant: string }> = {
    sm: {
      height: 32,
      paddingVertical: 4,
      paddingHorizontal: 16,
      textVariant: "text-14-bold-spaced",
    },
    md: {
      height: 58,
      paddingVertical: 0,
      paddingHorizontal: 16,
      textVariant: "text-16-bold-spaced",
    },
    lg: {
      height: 64,
      paddingVertical: 0,
      paddingHorizontal: 20,
      textVariant: "text-18-bold-spaced",
    },
  };

  const sizeConfig = sizeMap[size];
  const buttonHeight = height ?? sizeConfig.height;
  const paddingHorizontal = sizeConfig.paddingHorizontal;
  const paddingVertical = sizeConfig.paddingVertical;

  const bgClassMap: Record<ButtonVariant, string> = {
    primary: disabled ? "bg-blue-900-50" : "bg-blue-900",
    secondary: "bg-blue-400-30",
    social: "bg-white border border-gray-100",
    outline: disabled ? "bg-gray-50-light" : "bg-accent",
    outlineSecondary: "bg-gray-50-light border border-blue-900",
  };

  const textColorMap: Record<ButtonVariant, string> = {
    primary: "text-white",
    secondary: "text-gray-600",
    social: "text-gray-900",
    outline: disabled ? "text-gray-400" : "text-white",
    outlineSecondary: "text-blue-900",
  };

  const bgClass = bgClassMap[variant];
  const textColor = textColorMap[variant];
  const hasSideIcons = Boolean(leftIcon || rightIcon);

  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      className={`rounded-full-pill justify-center items-center ${bgClass} ${disabled ? "opacity-60" : ""
        } ${className}`}
      style={{
        ...(hasSideIcons
          ? { height: buttonHeight }
          : { minHeight: buttonHeight }),
        width: width,
        paddingHorizontal: paddingHorizontal,
        paddingVertical: paddingVertical,
      }}
    >
      {hasSideIcons ? (
        <View className="flex-row items-center justify-between w-full">
          {leftIcon ? (
            <View className="w-6 h-6">{leftIcon}</View>
          ) : (
            <View className="w-6 h-6" />
          )}
          <Typography variant={sizeConfig.textVariant as any} className={textColor}>
            {title}
          </Typography>
          {rightIcon ? (
            <View className="w-6 h-6">{rightIcon}</View>
          ) : (
            <View className="w-6 h-6" />
          )}
        </View>
      ) : (
        <View className="w-full min-w-0 justify-center items-center px-0.5 py-0.5">
          <Typography
            variant={sizeConfig.textVariant as any}
            className={`${textColor} text-center`}
            numberOfLines={4}
          >
            {title}
          </Typography>
        </View>
      )}
    </Pressable>
  );
};
