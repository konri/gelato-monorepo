export type ConfirmModalProps = {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message?: string;
  confirmText: string;
  cancelText: string;
  confirmVariant?: "primary" | "secondary" | "danger";
  isLoading?: boolean;
};
