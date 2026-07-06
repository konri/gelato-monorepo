import type { ReactNode } from "react";

export type SettingsReadOnlySectionRow =
  | {
      id: string;
      label: string;
      value: string;
      valueTone?: "default" | "muted";
      className?: string;
    }
  | {
      id: string;
      label: string;
      children: ReactNode;
      className?: string;
    };

export type SettingsReadOnlySectionProps = {
  header?: ReactNode;
  rows: SettingsReadOnlySectionRow[];
};
