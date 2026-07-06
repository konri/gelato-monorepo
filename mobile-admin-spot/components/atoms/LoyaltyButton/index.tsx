import { Typography } from "@/components/atoms/Typography";
import React from "react";
import { Pressable } from "react-native";
import { twMerge } from "tailwind-merge";

type LoyaltyButtonProps = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
};

export const LoyaltyButton = ({
  title,
  onPress,
  disabled = false,
}: LoyaltyButtonProps) => {
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      className={twMerge(
        "bg-blue-900 rounded-full items-center justify-center py-1.25 px-5 min-h-8 max-w-full",
        disabled ? "opacity-50" : ""
      )}
    >
      <Typography
        variant="text-14-bold-spaced"
        className="text-white text-center"
        numberOfLines={1}
      >
        {title}
      </Typography>
    </Pressable>
  );
};
