import type {
  MerchantStatsAnalyticsPayload,
  MerchantStatsMetricDeltaRow,
} from "@/shared/api-client/src/stats/types";
import { formatInteger } from "@/utils/merchantStatsFormat";

export const buildMerchantStatsMetricDeltaMap = (
  analytics: MerchantStatsAnalyticsPayload | null | undefined,
): ReadonlyMap<string, MerchantStatsMetricDeltaRow> => {
  const rows = analytics?.metricDeltas ?? [];
  return new Map(rows.map((row) => [row.path, row]));
};

const formatPercentRatio = (value: number, locale: string): string =>
  new Intl.NumberFormat(locale, {
    style: "percent",
    maximumFractionDigits: 1,
    minimumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);

export type MerchantStatsKpiDeltaParts = {
  percentLine: string | null;
  absoluteLine: string;
  isNeutralChange: boolean;
};

export const formatMerchantStatsKpiDeltaParts = (
  row: MerchantStatsMetricDeltaRow,
  locale: string,
  notApplicableLabel: string,
): MerchantStatsKpiDeltaParts => {
  const absRounded = Math.round(row.delta);
  const sign = row.delta >= 0 ? "+" : "";
  const absoluteLine = `${sign}${formatInteger(absRounded, locale)}`;
  const isNeutralChange =
    Math.abs(row.delta) < 0.000001 &&
    (row.deltaPct === null || !Number.isFinite(row.deltaPct) || Math.abs(row.deltaPct) < 0.000001);
  if (row.deltaPct !== null && Number.isFinite(row.deltaPct)) {
    return {
      percentLine: `${sign}${formatPercentRatio(row.deltaPct, locale)}`,
      absoluteLine,
      isNeutralChange,
    };
  }
  return {
    percentLine: null,
    absoluteLine: `${absoluteLine} · ${notApplicableLabel}`,
    isNeutralChange,
  };
};
