import React from "react";
import { Pressable } from "react-native";
import { twMerge } from "tailwind-merge";
import { Typography } from "@/components/atoms/Typography";

type TextButtonVariant = "primary" | "secondary" | "tertiary";

interface TextButtonProps {
  title: string;
  onPress: () => void;
  variant?: TextButtonVariant;
  disabled?: boolean;
  className?: string;
}

export const TextButton = ({
  title,
  onPress,
  variant = "primary",
  disabled = false,
  className = "",
}: TextButtonProps) => {
  const textColorMap: Record<TextButtonVariant, string> = {
    primary: "text-accent",
    secondary: "text-gray-600",
    tertiary: "text-gray-400",
  };

  const textColor = textColorMap[variant];

  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      className={disabled ? "opacity-50" : ""}
    >
      <Typography
        variant="text-18-semibold-spaced"
        className={twMerge(textColor, className)}
      >
        {title}
      </Typography>
    </Pressable>
  );
};
