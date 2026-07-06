import { Ionicons } from "@expo/vector-icons";

export type StreakMilestoneItem = {
  id: string;
  positionPercent: number;
  achieved: boolean;
  label: string;
  iconName?: keyof typeof Ionicons.glyphMap;
};

export type StreakMilestoneProgressBarProps = {
  progressPercentage: number;
  milestones: StreakMilestoneItem[];
  showLeftFade?: boolean;
  showRightFade?: boolean;
  inactiveMilestoneBorderStyle?: "solid" | "dashed";
  className?: string;
  trackClassName?: string;
  progressClassName?: string;
};
