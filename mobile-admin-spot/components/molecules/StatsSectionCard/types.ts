import type { ReactNode } from "react";

export type StatsSectionCardProps = {
  title: string;
  subtitle?: string;
  errorText?: string | null;
  children?: ReactNode;
};
