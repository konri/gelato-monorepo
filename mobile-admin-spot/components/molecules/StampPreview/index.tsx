import { calculateSymmetricalLayout } from "@/utils/stampUtils";
import React from "react";
import { View } from "react-native";

type StampPreviewProps = {
  count: number;
};

export const StampPreview = ({ count }: StampPreviewProps) => {
  const layout = calculateSymmetricalLayout(count);

  return (
    <View className="gap-1 p-2">
      {layout.map((stampsInRow, rowIndex) => (
        <View key={rowIndex} className="flex-row gap-1">
          {Array.from({ length: stampsInRow }, (_, index) => (
            <View
              key={`${rowIndex}-${index}`}
              className="w-3 h-3 rounded-full bg-gray-300-light"
            />
          ))}
        </View>
      ))}
    </View>
  );
};
