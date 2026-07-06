import type { MerchantStatsInsightItem } from "@/utils/merchantStatsInsights/types";

export type StatsInsightCalloutVariant = "good" | "warn" | "bad" | "info";

export type StatsInsightListProps = {
  items: MerchantStatsInsightItem[];
  showDisclaimer?: boolean;
};
