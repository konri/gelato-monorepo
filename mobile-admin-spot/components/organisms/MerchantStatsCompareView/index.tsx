import { Typography } from "@/components/atoms/Typography";
import { StatsCompareDeltaPill } from "@/components/molecules/StatsCompareDeltaPill";
import { StatsCompareModeChips } from "@/components/molecules/StatsSessionChips";
import { StatsDonutChart } from "@/components/molecules/StatsDonutChart";
import { StatsInsightList } from "@/components/molecules/StatsInsightList";
import { StatsMetricPairBarChart } from "@/components/molecules/StatsMetricPairBarChart";
import { StatsMultiSeriesLineChart } from "@/components/molecules/StatsMultiSeriesLineChart";
import { InfoBanner } from "@/components/molecules/InfoBanner";
import { StatsScreenHeading } from "@/components/molecules/StatsScreenHeading";
import {
  MERCHANT_STATS_CHART_PRIMARY_BLUE,
  MERCHANT_STATS_CHART_TREND_SECONDARY,
} from "@/constants/merchantStatsUi";
import { formatInteger, formatPercent, formatShortDate } from "@/utils/merchantStatsFormat";
import { useMerchantStatsSession } from "@/contexts/MerchantStatsSessionContext";
import type { MerchantStatsBundleData } from "@/shared/api-client/src/graphql/queries/merchantStats";
import type { MerchantStatsMetricDeltaRow } from "@/shared/api-client/src/stats/types";
import { useMerchantStatsChartLayout } from "@/hooks/useMerchantStatsChartLayout";
import { useMerchantStatsKpiDelta } from "@/hooks/useMerchantStatsKpiDelta";
import { buildMerchantStatsCompareModeLabels } from "@/utils/merchantStatsCompareLabels";
import { merchantStatsMetricDeltaPathLabel } from "@/utils/merchantStatsDeltaPathLabel";
import { buildCompareStatsInsights } from "@/utils/merchantStatsInsights";
import React, { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, View } from "react-native";

type MerchantStatsCompareViewProps = {
  bundle: MerchantStatsBundleData;
  screenSubtitle: string;
};

const sortMetricDeltas = (rows: MerchantStatsMetricDeltaRow[]): MerchantStatsMetricDeltaRow[] => {
  const copy = [...rows];
  copy.sort((a, b) => {
    const ap = a.deltaPct !== null && Number.isFinite(a.deltaPct) ? a.deltaPct : null;
    const bp = b.deltaPct !== null && Number.isFinite(b.deltaPct) ? b.deltaPct : null;
    if (ap === null && bp === null) {
      return 0;
    }
    if (ap === null) {
      return 1;
    }
    if (bp === null) {
      return -1;
    }
    return Math.abs(bp) - Math.abs(ap);
  });
  return copy;
};

export const MerchantStatsCompareView = ({
  bundle,
  screenSubtitle,
}: MerchantStatsCompareViewProps) => {
  const { t } = useTranslation();
  const { deltaNa, locale, partsForRow } = useMerchantStatsKpiDelta(bundle.analytics);
  const { trendChartWidth, trendChartHeight, contentWidth } = useMerchantStatsChartLayout();
  const { compareMode, setCompareMode } = useMerchantStatsSession();

  const compareLabels = useMemo(() => buildMerchantStatsCompareModeLabels(t), [t]);

  const analytics = bundle.analytics;
  const sortedDeltas = useMemo(
    () => sortMetricDeltas(analytics?.metricDeltas ?? []),
    [analytics?.metricDeltas],
  );

  const primaryPeriod = analytics?.primaryPeriod;
  const comparisonPeriod = analytics?.comparisonPeriod;

  const { sliceA, sliceB } = useMemo(() => {
    const trendA = bundle.trends?.series ?? [];
    const trendB = bundle.comparison?.trends?.series ?? [];
    const pairLen = Math.min(trendA.length, trendB.length);
    if (pairLen === 0) {
      return { sliceA: trendA.slice(0, 0), sliceB: trendB.slice(0, 0) };
    }
    return {
      sliceA: trendA.slice(-pairLen),
      sliceB: trendB.slice(-pairLen),
    };
  }, [bundle.comparison?.trends?.series, bundle.trends?.series]);

  const trendPrimaryValues = useMemo(
    () =>
      sliceA.map((row) => (Number.isFinite(row.ordersCreated) ? row.ordersCreated : 0)),
    [sliceA],
  );
  const trendComparisonValues = useMemo(
    () =>
      sliceB.map((row) => (Number.isFinite(row.ordersCreated) ? row.ordersCreated : 0)),
    [sliceB],
  );

  const sumOrdersA = useMemo(
    () => sliceA.reduce((acc, row) => acc + (Number.isFinite(row.ordersCreated) ? row.ordersCreated : 0), 0),
    [sliceA],
  );
  const sumOrdersB = useMemo(
    () => sliceB.reduce((acc, row) => acc + (Number.isFinite(row.ordersCreated) ? row.ordersCreated : 0), 0),
    [sliceB],
  );

  const xLabels = useMemo(() => {
    if (sliceA.length === 0) {
      return [];
    }
    const first = sliceA[0]?.periodStart ?? "";
    const mid = sliceA[Math.floor(sliceA.length / 2)]?.periodStart ?? "";
    const last = sliceA[sliceA.length - 1]?.periodStart ?? "";
    return [first, mid, last].map((iso) => formatShortDate(iso, locale));
  }, [locale, sliceA]);

  const formatBarValue = useCallback(
    (n: number) => {
      if (!Number.isFinite(n)) {
        return "—";
      }
      const r = Math.round(n);
      if (Math.abs(n - r) < 1e-6) {
        return formatInteger(r, locale);
      }
      return n.toLocaleString(locale, { maximumFractionDigits: 2, minimumFractionDigits: 0 });
    },
    [locale],
  );

  const pairBarItems = useMemo(
    () =>
      sortedDeltas.slice(0, 8).map((row) => ({
        label: merchantStatsMetricDeltaPathLabel(row.path, t),
        current: row.current,
        previous: row.previous,
      })),
    [sortedDeltas, t],
  );

  const ordersShareTotal = sumOrdersA + sumOrdersB;

  const compareInsights = useMemo(() => buildCompareStatsInsights(bundle), [bundle]);

  return (
    <View className="gap-5">
      <StatsScreenHeading title={t("MerchantStats.compareScreenTitle")} subtitle={screenSubtitle} />

      <View className="gap-2.5">
        <Typography variant="text-12-semibold" className="text-gray-600 uppercase tracking-wide">
          {t("MerchantStats.compareLabel")}
        </Typography>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          nestedScrollEnabled
          contentContainerClassName="flex-row gap-2.5 pr-1"
        >
          <StatsCompareModeChips
            value={compareMode}
            onChange={setCompareMode}
            labels={compareLabels}
            layout="row"
          />
        </ScrollView>
      </View>

      {compareMode === "none" ? (
        <Typography variant="text-14-regular-spaced" className="text-gray-600">
          {t("MerchantStats.compareNeedMode")}
        </Typography>
      ) : null}

      {compareMode !== "none" ? <StatsInsightList items={compareInsights} /> : null}

      {compareMode !== "none" && primaryPeriod && comparisonPeriod ? (
        <View className="bg-white rounded-3xl border border-gray-100-light p-4 shadow-settings-card flex-row items-stretch justify-between gap-2">
          <View className="flex-1 min-w-0">
            <Typography variant="text-12-semibold" className="text-gray-600 uppercase tracking-wide">
              {t("MerchantStats.comparePrimaryPeriod")}
            </Typography>
            <Typography variant="text-12-bold" className="text-gray-900 mt-1 leading-snug">
              {formatShortDate(primaryPeriod.from, locale)} – {formatShortDate(primaryPeriod.to, locale)}
            </Typography>
          </View>
          <View className="justify-center shrink-0 px-0.5">
            <Typography variant="text-12-bold" className="text-gray-400">
              {t("MerchantStats.compareVersusMid")}
            </Typography>
          </View>
          <View className="flex-1 min-w-0 items-end">
            <Typography variant="text-12-semibold" className="text-gray-600 uppercase tracking-wide text-right">
              {t("MerchantStats.compareVersusPeriod")}
            </Typography>
            <Typography variant="text-12-bold" className="text-gray-700 mt-1 leading-snug text-right">
              {formatShortDate(comparisonPeriod.from, locale)} – {formatShortDate(comparisonPeriod.to, locale)}
            </Typography>
          </View>
        </View>
      ) : null}

      {compareMode !== "none" && ordersShareTotal > 0 ? (
        <View className="bg-white rounded-3xl border border-gray-100-light p-4 shadow-settings-card gap-3">
          <Typography variant="text-14-bold" className="text-gray-900">
            {t("MerchantStats.compareDonutTitle")}
          </Typography>
          <Typography variant="text-12-regular" className="text-gray-500">
            {t("MerchantStats.compareDonutCaption")}
          </Typography>
          <View className="flex-row items-center gap-4 pt-1">
            <View className="shrink-0">
              <StatsDonutChart
                size={132}
                thickness={22}
                segments={[
                  { value: sumOrdersA, color: "#1A4196" },
                  { value: sumOrdersB, color: "#9CA3AF" },
                ]}
              />
            </View>
            <View className="flex-1 min-w-0 gap-3">
              <View className="gap-1">
                <View className="flex-row items-center gap-2">
                  <View className="w-2.5 h-2.5 rounded-full bg-blue-900" />
                  <Typography variant="text-12-semibold" className="text-gray-800 flex-1">
                    {t("MerchantStats.trendsLegendCurrent")}
                  </Typography>
                </View>
                <Typography variant="text-14-bold" className="text-gray-900 pl-4">
                  {formatInteger(sumOrdersA, locale)} · {formatPercent(sumOrdersA / ordersShareTotal, locale)}
                </Typography>
              </View>
              <View className="gap-1">
                <View className="flex-row items-center gap-2">
                  <View className="w-2.5 h-2.5 rounded-full bg-gray-400" />
                  <Typography variant="text-12-semibold" className="text-gray-800 flex-1">
                    {t("MerchantStats.trendsLegendPrevious")}
                  </Typography>
                </View>
                <Typography variant="text-14-bold" className="text-gray-600 pl-4">
                  {formatInteger(sumOrdersB, locale)} · {formatPercent(sumOrdersB / ordersShareTotal, locale)}
                </Typography>
              </View>
            </View>
          </View>
        </View>
      ) : null}

      {compareMode !== "none" && pairBarItems.length > 0 ? (
        <View className="bg-white rounded-3xl border border-gray-100-light p-4 shadow-settings-card gap-2">
          <Typography variant="text-14-bold" className="text-gray-900">
            {t("MerchantStats.comparePairBarsTitle")}
          </Typography>
          <Typography variant="text-12-regular" className="text-gray-500 mb-1">
            {t("MerchantStats.comparePairBarsNote")}
          </Typography>
          <StatsMetricPairBarChart
            width={contentWidth}
            items={pairBarItems}
            columnALabel={t("MerchantStats.trendsLegendCurrent")}
            columnBLabel={t("MerchantStats.trendsLegendPrevious")}
            formatValue={formatBarValue}
          />
        </View>
      ) : null}

      {compareMode !== "none" && sortedDeltas.length > 0 ? (
        <View className="bg-white rounded-3xl border border-gray-100-light p-4 shadow-settings-card gap-2">
          <Typography variant="text-12-semibold" className="text-gray-600 uppercase tracking-wide mb-1.5">
            {t("MerchantStats.compareDeltaSection")}
          </Typography>
          {sortedDeltas.map((row) => {
            const label = merchantStatsMetricDeltaPathLabel(row.path, t);
            const parts = partsForRow(row);
            const deltaPositive = row.delta >= 0;
            return (
              <View
                key={row.path}
                className="flex-row justify-between items-start py-2.5 border-b border-gray-100 gap-3"
              >
                <Typography variant="text-12-regular" className="text-gray-700 flex-1 min-w-0 pr-1 leading-snug">
                  {label}
                </Typography>
                <View className="items-end gap-1 shrink-0 max-w-2/5">
                  <Typography variant="text-14-bold" className="text-gray-900 text-right">
                    {formatInteger(Math.round(row.current), locale)}
                  </Typography>
                  <StatsCompareDeltaPill
                    parts={parts}
                    deltaPositive={deltaPositive}
                    notApplicableLabel={deltaNa}
                    textAlignEnd
                  />
                </View>
              </View>
            );
          })}
        </View>
      ) : null}

      {compareMode !== "none" && sliceA.length > 0 && sliceB.length > 0 ? (
        <View className="bg-white rounded-3xl border border-gray-100-light p-4 shadow-settings-card gap-2">
          <Typography variant="text-14-bold" className="text-gray-900">
            {t("MerchantStats.trendsActivityProxyTitle")}
          </Typography>
          <Typography variant="text-12-regular" className="text-gray-500">
            {t("MerchantStats.trendsActivityProxyNote")}
          </Typography>
          <View className="flex-row flex-wrap gap-x-4 gap-y-2 pt-1">
            <View className="flex-row items-center gap-2">
              <View className="w-3 h-3 rounded-full bg-blue-900" />
              <Typography variant="text-12-semibold" className="text-gray-700">
                {t("MerchantStats.trendsLegendCurrent")}
              </Typography>
            </View>
            <View className="flex-row items-center gap-2">
              <View className="w-8 h-0 border-t-2 border-dashed border-gray-300" />
              <Typography variant="text-12-semibold" className="text-gray-700">
                {t("MerchantStats.trendsLegendPrevious")}
              </Typography>
            </View>
          </View>
          <StatsMultiSeriesLineChart
            width={trendChartWidth}
            height={trendChartHeight}
            primaryValues={trendPrimaryValues}
            comparisonValues={trendComparisonValues}
            primaryColor={MERCHANT_STATS_CHART_PRIMARY_BLUE}
            comparisonColor={MERCHANT_STATS_CHART_TREND_SECONDARY}
          />
          {xLabels.length > 0 ? (
            <View className="flex-row justify-between px-0.5 gap-1">
              {xLabels.map((label, i) => (
                <View key={`${label}-${i}`} className="flex-1 min-w-0">
                  <Typography variant="text-12-regular" className="text-gray-500 text-center" numberOfLines={1}>
                    {label}
                  </Typography>
                </View>
              ))}
            </View>
          ) : null}
          <View className="flex-row gap-2 mt-2 pt-3 border-t border-gray-100">
            <View className="flex-1 bg-gray-50 rounded-lg p-2">
              <Typography variant="text-12-regular" className="text-gray-600">
                {t("MerchantStats.compareSumCurrent")}
              </Typography>
              <Typography variant="text-16-bold" className="text-blue-900 mt-1">
                {formatInteger(sumOrdersA, locale)}
              </Typography>
            </View>
            <View className="flex-1 bg-gray-50 rounded-lg p-2">
              <Typography variant="text-12-regular" className="text-gray-600">
                {t("MerchantStats.compareSumPrevious")}
              </Typography>
              <Typography variant="text-16-bold" className="text-gray-500 mt-1">
                {formatInteger(sumOrdersB, locale)}
              </Typography>
            </View>
          </View>
        </View>
      ) : null}

      {bundle.analytics?.storeMetricCoverage === "STORE_SCOPED_PARTIAL" ? (
        <InfoBanner variant="compact" text={t("MerchantStats.partialCoverageStatsNote")} />
      ) : null}
    </View>
  );
};
