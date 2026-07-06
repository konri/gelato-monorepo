import type { ReactNode } from "react";

export type CenteredModalCardLayoutProps = {
  visible: boolean;
  onClose: () => void;
  onApply: () => void;
  onReset: () => void;
  title?: string;
  resetButtonTitle?: string;
  applyButtonTitle?: string;
  children: ReactNode;
};
