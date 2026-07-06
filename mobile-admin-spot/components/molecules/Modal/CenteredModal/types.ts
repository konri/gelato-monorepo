import { ReactNode } from "react";

type ModalSize = "sm" | "md";

type CenteredModalProps = {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  size?: ModalSize;
};

export type { CenteredModalProps, ModalSize };
