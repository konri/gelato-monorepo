import React from "react";
import { View } from "react-native";
import { twMerge } from "tailwind-merge";

type SectionSeparatorProps = {
  className?: string;
};

export const SectionSeparator = ({ className = "" }: SectionSeparatorProps) => {
  return (
    <View className={twMerge("items-center py-5", className)}>
      <View className="h-0 border-t-2 border-blue-200 w-[45%]" />
    </View>
  );
};
