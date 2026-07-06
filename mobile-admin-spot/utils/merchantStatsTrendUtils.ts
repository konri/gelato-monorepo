import type { TrendPoint } from "@/shared/api-client/src/stats/types";

type TrendSeriesMetricKey =
  | "stampsEarnedUnits"
  | "ordersCreated"
  | "couponsClaimedByUsers"
  | "loyaltyCardsCreated"
  | "rewardsRedeemed"
  | "streakVisits";

const takeLastSeriesMetricValues = (
  series: TrendPoint[],
  key: TrendSeriesMetricKey,
  count: number,
): number[] => {
  if (count <= 0 || series.length === 0) {
    return [];
  }
  const slice = series.slice(-count);
  return slice.map((row) => {
    const raw = row[key];
    return typeof raw === "number" && Number.isFinite(raw) ? raw : 0;
  });
};

export const takeLastAlignedTrendPair = (
  primarySeries: TrendPoint[],
  compareSeries: TrendPoint[] | null | undefined,
  key: TrendSeriesMetricKey,
  maxPoints: number,
): { primary: number[]; compare: number[] | null } => {
  const p = takeLastSeriesMetricValues(primarySeries, key, maxPoints);
  if (!compareSeries || compareSeries.length === 0) {
    return { primary: p, compare: null };
  }
  const c = takeLastSeriesMetricValues(compareSeries, key, maxPoints);
  const n = Math.min(p.length, c.length);
  if (n === 0) {
    return { primary: p, compare: null };
  }
  return { primary: p.slice(-n), compare: c.slice(-n) };
};

export const aggregateTrendSeriesByWeekday = (
  series: TrendPoint[],
  key: TrendSeriesMetricKey,
): number[] => {
  const buckets = [0, 0, 0, 0, 0, 0, 0];
  for (const row of series) {
    const d = new Date(row.periodStart);
    if (Number.isNaN(d.getTime())) {
      continue;
    }
    const day = d.getUTCDay();
    const mondayFirstIndex = day === 0 ? 6 : day - 1;
    const raw = row[key];
    const n = typeof raw === "number" && Number.isFinite(raw) ? raw : 0;
    buckets[mondayFirstIndex] += n;
  }
  return buckets;
};
