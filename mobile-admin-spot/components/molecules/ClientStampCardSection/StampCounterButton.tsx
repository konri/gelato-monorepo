import React from "react";
import { Pressable } from "react-native";
import Svg, { Path } from "react-native-svg";

type StampCounterButtonProps = {
  type: "minus" | "plus";
  onPress: () => void;
  disabled?: boolean;
};

export const StampCounterButton = ({
  type,
  onPress,
  disabled = false,
}: StampCounterButtonProps) => (
  <Pressable
    onPress={disabled ? undefined : onPress}
    disabled={disabled}
    className={`w-14 h-14 rounded-full justify-center items-center bg-gray-50-light border border-blue-900 ${disabled ? "opacity-40" : ""}`}
  >
    <Svg width={12} height={12} viewBox="0 0 12 12" fill="none">
      {type === "plus" ? (
        <Path d="M6 1V11M1 6H11" stroke="#1A4196" strokeWidth={2} strokeLinecap="round" />
      ) : (
        <Path d="M1 6H11" stroke="#1A4196" strokeWidth={2} strokeLinecap="round" />
      )}
    </Svg>
  </Pressable>
);
