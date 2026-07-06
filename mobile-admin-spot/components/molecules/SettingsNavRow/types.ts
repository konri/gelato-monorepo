import type { ReactNode } from "react";

export type SettingsNavRowProps = {
  title: string;
  onPress: () => void;
  showDivider?: boolean;
  leftIcon?: ReactNode;
  trailingLabel?: string;
  variant?: "default" | "danger";
};
