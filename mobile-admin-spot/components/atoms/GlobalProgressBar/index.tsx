import { Typography } from "@/components/atoms/Typography";
import React from "react";
import { View } from "react-native";
import { twMerge } from "tailwind-merge";

type GlobalProgressBarProps = {
  currentStep: number;
  totalSteps: number;
  title: string;
  subtitle: string;
  className?: string;
};

export const GlobalProgressBar = ({
  currentStep,
  totalSteps,
  title,
  subtitle,
  className,
}: GlobalProgressBarProps) => {
  const progressPercentage = (currentStep / totalSteps) * 100;

  return (
    <View className={twMerge("bg-white rounded-2xl p-4 gap-2.5", className)}>
      <View className="h-1 bg-gray-lighter rounded-[18px] overflow-hidden">
        <View
          className="h-1 bg-blue-900 rounded-[18px]"
          style={{ width: `${progressPercentage}%` }}
        />
      </View>

      <View className="gap-1">
        <Typography variant="text-18-black-spaced" className="text-black">
          {title}
        </Typography>
        <Typography variant="text-14-regular-spaced" className="text-black">
          {subtitle}
        </Typography>
      </View>
    </View>
  );
};

