export type MerchantRewardCardVariant = "reward" | "add";

export type MerchantRewardCardProps = {
  variant: MerchantRewardCardVariant;
  title?: string;
  stampsRequired?: number;
  imageUrl?: string | null;
  logoUrl?: string | null;
  stampsLabel?: string;
  onPress?: () => void;
  onDelete?: () => void;
  disabled?: boolean;
  selected?: boolean;
};
