import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, type PressableProps, View } from "react-native";

export const FLOAT_ROUND_IMAGE_CONTROL_CLASS =
  "h-8 w-8 items-center justify-center rounded-full bg-white shadow-md";

export type FloatRoundImageControlProps = {
  onPress: PressableProps["onPress"];
  accessibilityLabel: string;
  elevation?: number;
  icon?: keyof typeof Ionicons.glyphMap;
  iconSize?: number;
  iconColor?: string;
  children?: React.ReactNode;
};

export const FloatRoundImageControl = ({
  onPress,
  accessibilityLabel,
  elevation = 8,
  icon,
  iconSize = 16,
  iconColor = "#000000",
  children,
}: FloatRoundImageControlProps) => (
  <Pressable
    onPress={onPress}
    accessibilityLabel={accessibilityLabel}
    className={FLOAT_ROUND_IMAGE_CONTROL_CLASS}
    style={{ elevation }}
  >
    {children != null ? (
      children
    ) : icon != null ? (
      <Ionicons name={icon} size={iconSize} color={iconColor} />
    ) : null}
  </Pressable>
);

export type FloatImageActionAnchorProps = {
  className: string;
  children: React.ReactNode;
};

export const FloatImageActionAnchor = ({ className, children }: FloatImageActionAnchorProps) => (
  <View className={className} style={{ pointerEvents: "box-none" }}>
    {children}
  </View>
);
