import { Typography } from "@/components/atoms/Typography";
import { StampCard } from "@/components/molecules/StampCard";
import React from "react";
import { View } from "react-native";
import Svg, { Line } from "react-native-svg";
import { AmountModeSection } from "./AmountModeSection";
import { VisitModeSection } from "./VisitModeSection";
import type { ClientStampCardSectionProps } from "./types";

const SectionDivider = () => (
  <View className="items-center">
    <Svg width={156} height={2} viewBox="0 0 157 2" fill="none">
      <Line x1="0" y1="1" x2="157" y2="1" stroke="rgba(7, 58, 167, 0.26)" strokeWidth={2} />
    </Svg>
  </View>
);

export const ClientStampCardSection = (props: ClientStampCardSectionProps) => {
  const {
    title,
    progressLabel,
    stampCardProps,
    onAddStamp,
    assignStampsLabel,
    isAddingStamp = false,
    readOnly = false,
  } = props;

  const hasStampCard = !!stampCardProps;

  return (
    <View className="bg-white rounded-2xl p-4 gap-2">
      {hasStampCard && (
        <View className="gap-4">
          {title && progressLabel && (
            <View className="flex-row items-center justify-between">
              <Typography variant="text-16-bold" className="text-black">
                {title}
              </Typography>
              <View className="bg-accent rounded-full px-3 py-[1px] items-center justify-center">
                <Typography variant="text-16-bold" className="text-white">
                  {progressLabel}
                </Typography>
              </View>
            </View>
          )}

          <StampCard {...stampCardProps} showHeader={false} showFooter={false} />
        </View>
      )}

      {!readOnly && (
        <View className="gap-4">
          <SectionDivider />
          <Typography variant="text-18-bold-tight" className="text-black text-center">
            {assignStampsLabel}
          </Typography>

          {props.stampAwardMode === "amount" ? (
            <AmountModeSection
              amountPerStamp={props.amountPerStamp}
              onAddStamp={onAddStamp}
              isAddingStamp={isAddingStamp}
              spentAmountPlaceholder={props.spentAmountPlaceholder}
              onSpentAmountFocus={props.onSpentAmountFocus}
              onSpentAmountBlur={props.onSpentAmountBlur}
            />
          ) : (
            <VisitModeSection
              stampCount={props.stampCount}
              onStampCountChange={props.onStampCountChange}
              onAddStamp={onAddStamp}
              addStampLabel={props.addStampLabel}
              isAddingStamp={isAddingStamp}
            />
          )}
        </View>
      )}
    </View>
  );
};
