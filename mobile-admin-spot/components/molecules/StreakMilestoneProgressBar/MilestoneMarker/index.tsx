import { Ionicons } from "@expo/vector-icons";
import { View } from "react-native";
import { twMerge } from "tailwind-merge";
import type { MilestoneMarkerProps } from "./types";

export const MilestoneMarker = ({
  milestone,
  inactiveMilestoneBorderStyle,
}: MilestoneMarkerProps) => (
  <View
    className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-20"
    style={{ left: `${milestone.positionPercent}%` }}
  >
    <View
      className={twMerge(
        "w-7 h-7 rounded-full items-center justify-center border-2",
        milestone.achieved ? "bg-red-500 border-red-500" : "bg-white border-gray-300",
        !milestone.achieved &&
          (inactiveMilestoneBorderStyle === "dashed" ? "border-dashed" : "border-solid"),
      )}
    >
      {milestone.iconName ? (
        <Ionicons
          name={milestone.iconName}
          size={14}
          color={milestone.achieved ? "#FFFFFF" : "#B0B0B0"}
        />
      ) : null}
    </View>
  </View>
);
