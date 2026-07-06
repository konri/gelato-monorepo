import React from "react";
import { Pressable } from "react-native";
import Svg, { Path } from "react-native-svg";
import type { CircularIconButtonProps } from "./types";

export const CircularIconButton = ({
  onPress,
  size = 32,
  backgroundColor,
  iconColor = "#FFFFFF",
  disabled = false,
}: CircularIconButtonProps) => {
  const sizeClass =
    size === 32
      ? "w-8 h-8"
      : size === 24
      ? "w-6 h-6"
      : size === 40
      ? "w-10 h-10"
      : "w-8 h-8";
  const bgClass = backgroundColor?.startsWith("#")
    ? ""
    : backgroundColor || "bg-blue-900";
  const bgStyle = backgroundColor?.startsWith("#")
    ? { backgroundColor }
    : undefined;

  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      className={`${sizeClass} rounded-full justify-center items-center ${bgClass} ${
        disabled ? "opacity-50" : ""
      }`}
      style={bgStyle}
    >
      <Svg
        width={size * 0.4}
        height={size * 0.4}
        viewBox="0 0 12 12"
        fill="none"
      >
        <Path
          d="M6 1V11M1 6H11"
          stroke={iconColor}
          strokeWidth={2}
          strokeLinecap="round"
        />
      </Svg>
    </Pressable>
  );
};
