export type CouponRewardPickerModalProps = {
  visible: boolean;
  selectedRewardId?: string;
  onClose: () => void;
  onSave: (rewardId: string, rewardTitle?: string) => void;
  onCreateNew: () => void;
};
