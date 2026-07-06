import { Typography } from "@/components/atoms/Typography";
import { shadows } from "@/constants/shadows";
import React from "react";
import { Pressable, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import type { CompanySetupCardProps } from "./types";

export const CompanySetupCard = ({
  title,
  description,
  onPress,
  disabled = false,
}: CompanySetupCardProps) => {
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      className="bg-white rounded-2xl"
      style={shadows.sm}
    >
      <View className="w-full h-36 justify-center items-center bg-gray-200 rounded-t-2xl">
        <View className="w-12 h-12 rounded-full justify-center items-center bg-gray-400-light">
          <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
            <Path
              d="M12 5V19M5 12H19"
              stroke="#000"
              strokeWidth={2}
              strokeLinecap="round"
            />
          </Svg>
        </View>
      </View>

      <View className="flex-row items-start px-4 py-3 gap-3">
        <View
          className="w-9 h-9 rounded-full bg-gray-300"
          style={shadows.md}
        />

        <View className="flex-1 gap-0">
          <Typography variant="text-16-bold" className="text-black">
            {title}
          </Typography>
          <Typography variant="text-12-regular" className="text-black">
            {description}
          </Typography>
        </View>
      </View>
    </Pressable>
  );
};
