import { useMerchantStatsLocale } from "@/hooks/useMerchantStats";
import type { MerchantStatsAnalyticsPayload } from "@/shared/api-client/src/stats/types";
import type { MerchantStatsMetricDeltaRow } from "@/shared/api-client/src/stats/types";
import {
  buildMerchantStatsMetricDeltaMap,
  formatMerchantStatsKpiDeltaParts,
  type MerchantStatsKpiDeltaParts,
} from "@/utils/merchantStatsMetricDelta";
import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";

export const useMerchantStatsKpiDelta = (
  analytics: MerchantStatsAnalyticsPayload | null | undefined,
) => {
  const { t } = useTranslation();
  const locale = useMerchantStatsLocale();
  const deltaNa = t("MerchantStats.deltaNotApplicable");
  const deltaMap = useMemo(() => buildMerchantStatsMetricDeltaMap(analytics), [analytics]);
  const showDelta = analytics?.compareMode !== "none";

  const partsForPath = useCallback(
    (path: string): MerchantStatsKpiDeltaParts | null => {
      if (!showDelta) {
        return null;
      }
      const row = deltaMap.get(path);
      if (!row) {
        return null;
      }
      return formatMerchantStatsKpiDeltaParts(row, locale, deltaNa);
    },
    [deltaMap, deltaNa, locale, showDelta],
  );

  const partsForRow = useCallback(
    (row: MerchantStatsMetricDeltaRow): MerchantStatsKpiDeltaParts =>
      formatMerchantStatsKpiDeltaParts(row, locale, deltaNa),
    [deltaNa, locale],
  );

  return { deltaMap, showDelta, deltaNa, locale, partsForPath, partsForRow };
};
