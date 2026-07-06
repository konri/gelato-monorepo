import type { ReactNode } from "react";

export type StatsHubHeroCardProps = {
  titleRow: string;
  scopeLine: string | null;
  value: string;
  deltaContent: ReactNode | null;
  chart: ReactNode | null;
  chartFootnote: string | null;
};
