import type { StatsCompareMode } from "@/shared/api-client/src/stats/types";
import type { TFunction } from "i18next";

export const buildMerchantStatsCompareModeLabels = (
  t: TFunction,
): Record<StatsCompareMode, string> => ({
  none: t("MerchantStats.compareNone"),
  previous_period: t("MerchantStats.comparePreviousPeriod"),
  previous_year: t("MerchantStats.comparePreviousYear"),
});
