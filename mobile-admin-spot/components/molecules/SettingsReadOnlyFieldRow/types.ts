import type { ReactNode } from "react";

export type SettingsReadOnlyFieldRowProps =
  | {
      label: string;
      value: string;
      valueTone?: "default" | "muted";
      className?: string;
    }
  | {
      label: string;
      children: ReactNode;
      className?: string;
    };
