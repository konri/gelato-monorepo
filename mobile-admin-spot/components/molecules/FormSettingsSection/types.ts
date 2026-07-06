import type { ReactNode } from "react";

export type FormSettingsSectionProps = {
  title: string;
  description?: string;
  leading?: ReactNode;
  children: ReactNode;
};
