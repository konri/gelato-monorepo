export type ImagePickerActionsProps = {
  value: string | null;
  onPick?: () => void;
  onRemove?: () => void;
  readOnly?: boolean;
  showPickFloat?: boolean;
  floatClassName?: string;
  pickAccessibilityLabel?: string;
  removeAccessibilityLabel?: string;
};
