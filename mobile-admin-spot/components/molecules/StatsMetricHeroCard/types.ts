import type { ReactNode } from "react";

export type StatsMetricHeroCardAccent = "blue" | "emerald";

export type StatsMetricHeroCardProps = {
  accent: StatsMetricHeroCardAccent;
  label: string;
  value: string;
  detail?: ReactNode;
};
