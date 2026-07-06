import type { StreakStageFormData } from "@/app/company/streaks/types";
import type { SelectOption } from "@/components/atoms/FormSelect/types";

export type StreakStageFormCardProps = {
  index: number;
  stagesCount: number;
  stage: StreakStageFormData | undefined;
  rewardTitlesById: Map<string, string>;
  benefitTypeOptions: SelectOption[];
  onRemove: (index: number) => void;
  onOpenRewardPicker: (index: number) => void;
  onClearReward: (index: number) => void;
};
