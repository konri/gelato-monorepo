import { Typography } from "@/components/atoms/Typography";
import { MilestoneRewardSection } from "@/components/molecules/MilestoneRewardSection";
import { calculateStampGrid } from "@/utils/stampUtils";
import React, { useMemo } from "react";
import { View } from "react-native";
import { Stamp } from "./Stamp";
import type { StampCardProps } from "./types";
import { useMilestoneData } from "./useMilestoneBackgroundClasses";

export const StampCard = ({
  title,
  progress,
  description,
  rateText,
  totalStamps,
  filledStamps,
  milestoneStampsRequired,
  milestoneTitle,
  stampStyleUrl,
  showHeader = true,
  showFooter = true,
}: StampCardProps) => {

  const { layout } = useMemo(
    () => calculateStampGrid(totalStamps, 4),
    [totalStamps]
  );

  const stamps = useMemo(
    () => Array.from({ length: totalStamps }, (_, index) => ({
      filled: index < filledStamps,
      inMilestone: milestoneStampsRequired ? index < milestoneStampsRequired : false,
    })),
    [totalStamps, filledStamps, milestoneStampsRequired]
  );

  const { firstMilestoneRowIndex, isOnlyInFirstRow, isRowPartial, rowData } = useMilestoneData({
    layout,
    stamps,
  });

  let stampIndex = 0;

  return (
    <View className="gap-2 w-full">
      {showHeader && (
        <View className="flex flex-row justify-between w-full pt-2">
          <Typography variant="text-16-bold" className="text-black flex-1">
            {title}
          </Typography>
          <View className="bg-accent rounded-full items-center justify-center px-3 min-w-12 h-6">
            <Typography variant="text-16-bold" className="text-white text-center">
              {progress}
            </Typography>
          </View>
        </View>
      )}

      <View
        className="w-full overflow-hidden py-2"

      >
        {layout.map((stampsInRow, rowIndex) => {
          const rowStamps = stamps.slice(stampIndex, stampIndex + stampsInRow);
          const currentStampIndex = stampIndex;
          stampIndex += stampsInRow;

          const { milestoneStampsInRow, hasMilestoneStamps, isFirstMilestoneRow, backgroundClassName } =
            rowData[rowIndex];

          return (
            <React.Fragment key={rowIndex}>
              <View className="relative py-2">
                {hasMilestoneStamps && (
                  <View className="absolute inset-0 flex-row z-0">
                    <View
                      className={backgroundClassName}
                      style={{
                        width: `${(milestoneStampsInRow / stampsInRow) * 100}%`,
                      }}
                    />
                  </View>
                )}
                <View className="flex-row gap-2 relative z-10">
                  {rowStamps.map((stamp, index) => (
                    <View
                      key={currentStampIndex + index}
                      className="flex-1 items-center"
                    >
                      <Stamp isFilled={stamp.filled} iconUrl={stampStyleUrl} />
                    </View>
                  ))}
                </View>
              </View>
              {isFirstMilestoneRow && milestoneTitle && (
                <MilestoneRewardSection
                  milestoneStampsRequired={milestoneStampsRequired!}
                  milestoneTitle={milestoneTitle}
                  filledStamps={filledStamps}
                  isOnlyInFirstRow={isOnlyInFirstRow}
                  hasRightRoundedTopCorner={isRowPartial(firstMilestoneRowIndex!)}
                  hasRightRoundedBottomCorner={isRowPartial(firstMilestoneRowIndex! + 1)}
                />
              )}
            </React.Fragment>
          );
        })}
      </View>

      {showFooter && (
        <View className="items-center gap-2 w-full">
          {description && (
            <Typography
              variant="text-14-bold"
              className="text-accent text-center"
            >
              {description}
            </Typography>
          )}
          <View className="border border-accent rounded-full items-center justify-center py-2 px-4 min-w-36 h-10">
            <Typography variant="text-14-bold" className="text-black">
              {rateText}
            </Typography>
          </View>
        </View>
      )}
    </View>
  );
};
