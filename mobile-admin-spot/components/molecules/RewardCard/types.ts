import type { ReactNode } from "react";

export type RewardCardProps = {
  title: string;
  cost: number;
  stampsLabel: string;
  imageUrl?: string;
  logoUrl?: string;
  imageContent?: ReactNode;
  containerClassName?: string;
  valueSummary?: string | null;
};
