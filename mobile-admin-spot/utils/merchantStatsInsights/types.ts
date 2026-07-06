import type { StatsInsightCalloutVariant } from "@/components/molecules/StatsInsightList/types";

export type MerchantStatsInsightItem = {
  priority: number;
  variant: StatsInsightCalloutVariant;
  titleKey: string;
  bodyKey: string;
  params?: Record<string, string | number>;
};
