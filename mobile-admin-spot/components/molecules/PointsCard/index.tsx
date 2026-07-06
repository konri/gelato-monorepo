import { Typography } from "@/components/atoms/Typography";
import React from "react";
import { View } from "react-native";

type PointsCardProps = {
  points: string;
  rateText: string;
  description?: string;
};

export const PointsCard = ({ points, rateText, description }: PointsCardProps) => {
  return (
    <View className="items-center gap-2 w-full">
      <Typography variant="text-24-bold" className="text-accent text-center">
        {points}
      </Typography>
      {description ? (
        <Typography variant="text-14-bold" className="text-accent text-center">
          {description}
        </Typography>
      ) : null}
      <View className="border border-accent rounded-full items-center justify-center py-2 px-4 min-w-36 h-10">
        <Typography variant="text-14-bold" className="text-black">
          {rateText}
        </Typography>
      </View>
    </View>
  );
};
