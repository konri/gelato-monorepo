import { Typography } from "@/components/atoms/Typography";
import React from "react";
import { DimensionValue, Pressable, View } from "react-native";

type ButtonVariant = "primary" | "secondary" | "social" | "social-large" | "outline" | "ghost";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  width?: DimensionValue;
  height?: number;
  disabled?: boolean;
  className?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  textColor?: string;
  textVariant?: 'body-base-bold-spaced' | 'body-small-semibold' | 'body-base-small' | 'body-base-bold' | 'body-xl-bold';
  iconPadding?: number;
  backgroundColor?: string;
}

export const Button = ({
  title,
  onPress,
  variant = "primary",
  width = "100%",
  height = 58,
  disabled = false,
  className = "",
  leftIcon,
  rightIcon,
  textColor,
  textVariant = "body-base-bold-spaced",
  iconPadding = 0,
  backgroundColor,
}: ButtonProps) => {
  const bgClassMap: Record<ButtonVariant, string> = {
    primary: disabled ? "bg-button-primaryDisabled" : "bg-button-primary",
    secondary: "bg-button-secondary",
    social: "bg-background-primary border border-border-light",
    "social-large": "bg-background-primary border border-border-light",
    outline: disabled ? "bg-button-disabled" : "bg-accent",
    ghost: "bg-transparent border border-gray-300",
  };

  const textColorMap: Record<ButtonVariant, string> = {
    primary: "text-white",
    secondary: "text-text-subtitle",
    social: "text-text-primary",
    "social-large": "text-text-primary",
    outline: disabled ? "text-text-tertiary" : "text-white",
    ghost: "text-black",
  };

  const getLayoutClasses = () => {
    if (leftIcon && rightIcon) return 'justify-between';
    if (leftIcon && !rightIcon) return 'justify-center gap-2';
    return 'justify-center';
  };

  const getIconSize = () => {
    return variant === "social-large" ? "w-7 h-7" : "w-6 h-6";
  };

  const renderContent = () => {
    const iconClass = getIconSize();
    
    if (leftIcon && rightIcon) {
      return (
        <>
          <View className={iconClass} style={{marginLeft: iconPadding}}>{leftIcon}</View>
          <Typography variant={textVariant} className={finalTextColor}>
            {title}
          </Typography>
          <View className={iconClass} style={{marginRight: iconPadding}}>{rightIcon}</View>
        </>
      );
    }
    
    if (leftIcon && !rightIcon) {
      return (
        <>
          <View className={iconClass} style={{marginLeft: iconPadding}}>{leftIcon}</View>
          <Typography variant={textVariant} className={finalTextColor}>
            {title}
          </Typography>
        </>
      );
    }
    
    if (!leftIcon && rightIcon) {
      return (
        <>
          <Typography variant={textVariant} className={finalTextColor}>
            {title}
          </Typography>
          <View className={iconClass} style={{marginRight: iconPadding}}>{rightIcon}</View>
        </>
      );
    }
    
    return (
      <Typography variant={textVariant} className={finalTextColor}>
        {title}
      </Typography>
    );
  };

  const bgClass = backgroundColor ? "" : bgClassMap[variant];
  const finalBackgroundColor = backgroundColor || undefined;
  const finalTextColor = textColor || textColorMap[variant];

  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      className={`rounded-full-pill justify-center items-center ${bgClass} ${
        disabled ? "opacity-60" : ""
      } ${className}`}
      style={{
        height: height,
        width: width,
        ...(finalBackgroundColor && { backgroundColor: finalBackgroundColor }),
      }}
    >
      <View className={`flex-row items-center ${getLayoutClasses()} w-full h-full`}>
        {renderContent()}
      </View>
    </Pressable>
  );
};

