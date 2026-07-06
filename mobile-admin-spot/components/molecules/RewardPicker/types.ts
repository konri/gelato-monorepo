import type { Reward } from "@/shared/api-client/src/graphql/queries/myRewards";

export type RewardPickerProps = {
  rewards: Reward[];
  onSelect: (reward: Reward) => void;
  onCreateNew: () => void;
  onBack: () => void;
  onNext: () => void;
  canGoNext: boolean;
  selectedRewardId?: string;
  title?: string;
  subtitle?: string;
  refreshing?: boolean;
  onRefresh?: () => Promise<void> | void;
};
