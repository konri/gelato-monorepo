import { Button } from "@/components/atoms/Button";
import { Typography } from "@/components/atoms/Typography";
import React from "react";
import { View } from "react-native";
import { StampCounterButton } from "./StampCounterButton";
import { STAMP_COUNT_MAX, STAMP_COUNT_MIN } from "./types";

type VisitModeSectionProps = {
  stampCount: number;
  onStampCountChange: (count: number) => void;
  onAddStamp: (count: number) => Promise<boolean>;
  addStampLabel: string;
  isAddingStamp: boolean;
};

export const VisitModeSection = ({
  stampCount,
  onStampCountChange,
  onAddStamp,
  addStampLabel,
  isAddingStamp,
}: VisitModeSectionProps) => (
  <>
    <View className="flex-row justify-center gap-4">
      <StampCounterButton
        type="minus"
        onPress={() => onStampCountChange(Math.max(STAMP_COUNT_MIN, stampCount - 1))}
        disabled={stampCount <= STAMP_COUNT_MIN}
      />

      <View className="rounded-lg px-4 py-1 items-center justify-center">
        <Typography variant="text-56-bold" className="text-black">
          {stampCount}
        </Typography>
      </View>

      <StampCounterButton
        type="plus"
        onPress={() => onStampCountChange(Math.min(STAMP_COUNT_MAX, stampCount + 1))}
        disabled={stampCount >= STAMP_COUNT_MAX}
      />
    </View>

    <Button
      title={addStampLabel}
      onPress={async () => {
        await onAddStamp(stampCount);
      }}
      variant="primary"
      width="100%"
      size="sm"
      disabled={isAddingStamp}
    />
  </>
);
