import { Typography } from "@/components/atoms/Typography";
import React from "react";
import { View } from "react-native";
import type { IntermediateRewardScenarioBoxProps } from "./types";

export const IntermediateRewardScenarioBox = ({
  id,
  title,
  boldTitle,
  leftSteps,
  rightTitle,
  rightItems,
}: IntermediateRewardScenarioBoxProps) => {
  return (
    <View
      className="rounded-2xl p-4 gap-3 border border-blue-soft bg-blue-extra-light shadow-sm"
    >
      <Typography variant="text-12-semibold" className="text-blue-muted">
        {title}
        {boldTitle ? (
          <Typography
            variant="text-12-bold"
            className="text-red-deep"
          >
            {` ${boldTitle}`}
          </Typography>
        ) : null}
      </Typography>
      <View className="flex-row gap-4">
        <View className="flex-1 gap-[11px] mt-6">
          {leftSteps.map((step, index) => (
            <View
              key={`${id}-${step}-${index}`}
              className="flex-row items-center gap-1.5"
            >
              <View className="w-3.5 h-3.5 rounded-full bg-blue-muted items-center justify-center">
                <Typography variant="text-9-bold" className="text-white">
                  {index + 1}
                </Typography>
              </View>
              <Typography variant="text-9-bold" className="text-black">
                {step}
              </Typography>
            </View>
          ))}
        </View>
        <View className="w-24 gap-2">
          <Typography variant="text-9-bold" className="flex text-blue-muted text-center">
            {rightTitle}
          </Typography>
          <View className="gap-2 relative">
            <View className="absolute left-1/2 -ml-0.5 top-0 bottom-0 w-px bg-blue-muted" />
            {rightItems.map((item, index) => (
              <View
                key={`${id}-${item}-${index}`}
                className="rounded-2xl py-1 px-2 items-center border border-blue-muted gap-2 bg-white"
              >
                <Typography variant="text-9-bold" className="text-blue-muted">
                  {item}
                </Typography>
              </View>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
};


