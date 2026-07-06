export type RedeemRewardModalProps = {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
  rewardTitle: string;
  rewardCost: number;
  stampsLabel: string;
  imageUrl?: string | null;
  logoUrl?: string;
  showMilestoneResetInfoBanner?: boolean;
};
