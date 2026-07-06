import type { Reward } from "@/shared/api-client/src/graphql/queries/myRewards";

export type RewardGridProps = {
  rewards: Reward[];
  onSelect: (reward: Reward) => void;
  onDelete?: (reward: Reward) => void;
  getItemKey?: (reward: Reward, index: number) => string;
  showAddCard?: boolean;
  addCardTitle?: string;
  onCreateNew?: () => void;
  disableInactiveRewards?: boolean;
  selectedRewardId?: string;
  getScopeLabel?: (reward: Reward) => string | undefined;
};
