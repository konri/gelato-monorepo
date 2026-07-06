export type CircularMerchantLogoPickerVariant = "elevated" | "stack" | "profile";

export type CircularMerchantLogoPickerProps = {
  imageUri: string | null;
  onChange?: (uri: string) => void;
  onRemove?: () => void;
  readOnly?: boolean;
  className?: string;
  variant: CircularMerchantLogoPickerVariant;
  pickAccessibilityLabel?: string;
  removeAccessibilityLabel?: string;
};
