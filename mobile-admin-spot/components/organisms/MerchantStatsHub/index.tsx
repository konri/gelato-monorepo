import { Typography } from "@/components/atoms/Typography";
import { DashboardMenuItem } from "@/components/molecules/DashboardMenuItem";
import { StatsCompareDeltaPill } from "@/components/molecules/StatsCompareDeltaPill";
import { StatsHubDualLineChart } from "@/components/molecules/StatsHubDualLineChart";
import { StatsHubHeroCard } from "@/components/molecules/StatsHubHeroCard";
import { StatsHubMetricTile } from "@/components/molecules/StatsHubMetricTile";
import { StatsInsightList } from "@/components/molecules/StatsInsightList";
import {
  MERCHANT_STATS_CHART_HUB_COMPARE_LINE,
  MERCHANT_STATS_CHART_PRIMARY_BLUE,
} from "@/constants/merchantStatsUi";
import { formatCompactInt, formatInteger, formatShortDate } from "@/utils/merchantStatsFormat";
import { takeLastAlignedTrendPair } from "@/utils/merchantStatsTrendUtils";
import { useMerchantStatsSession } from "@/contexts/MerchantStatsSessionContext";
import { useMerchantStatsKpiDelta } from "@/hooks/useMerchantStatsKpiDelta";
import { useOperatorAccess } from "@/hooks/useOperatorAccess";
import type { MerchantStatsBundleData } from "@/shared/api-client/src/graphql/queries/merchantStats";
import { merchantStatsPresetHubChipI18nKey } from "@/utils/merchantStatsPeriod";
import { buildHubStatsInsights } from "@/utils/merchantStatsInsights";
import { router } from "expo-router";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

type MerchantStatsHubProps = {
  bundle: MerchantStatsBundleData;
};

export const MerchantStatsHub = ({ bundle }: MerchantStatsHubProps) => {
  const { t } = useTranslation();
  const { deltaMap, showDelta, deltaNa, locale, partsForPath } = useMerchantStatsKpiDelta(
    bundle.analytics,
  );
  const { storeScope, selectedStoreId, compareMode, preset } = useMerchantStatsSession();
  const { stores } = useOperatorAccess();

  const periodBounds = useMemo(() => {
    const src =
      bundle.analytics?.primaryPeriod ??
      bundle.trends?.period ??
      bundle.users?.period;
    if (!src) {
      return null;
    }
    return {
      fromLabel: formatShortDate(src.from, locale),
      toLabel: formatShortDate(src.to, locale),
    };
  }, [bundle.analytics?.primaryPeriod, bundle.trends?.period, bundle.users?.period, locale]);

  const scopePillLabel = useMemo(() => {
    const range =
      periodBounds !== null ? `${periodBounds.fromLabel} – ${periodBounds.toLabel}` : "";
    const storeName =
      selectedStoreId !== null
        ? (stores.find((s) => s.id === selectedStoreId)?.name ?? null)
        : null;
    const scopePart =
      storeScope === "network"
        ? t("MerchantStats.storeScopeNetwork")
        : storeName ?? t("MerchantStats.storeScopeContext");
    return range.length > 0 ? `${scopePart} · ${range}` : scopePart;
  }, [periodBounds, selectedStoreId, storeScope, stores, t]);

  const presetChip = t(merchantStatsPresetHubChipI18nKey(preset));
  const heroTitleRow = `${t("MerchantStats.kpiActiveClients")} · ${presetChip}`;

  const { primary: heroPrimaryTrend, compare: heroCompareTrend } = useMemo(
    () =>
      takeLastAlignedTrendPair(
        bundle.trends?.series ?? [],
        bundle.comparison?.trends?.series,
        "streakVisits",
        14,
      ),
    [bundle.comparison?.trends?.series, bundle.trends?.series],
  );

  const heroHasDualTrend =
    showDelta &&
    heroCompareTrend !== null &&
    heroCompareTrend.length > 0 &&
    heroCompareTrend.length === heroPrimaryTrend.length;

  const heroChartFootnote = useMemo(() => {
    if (heroPrimaryTrend.length === 0) {
      return null;
    }
    return heroHasDualTrend
      ? t("MerchantStats.hubHeroChartFootnoteCompare")
      : t("MerchantStats.hubHeroChartFootnoteSingle");
  }, [heroHasDualTrend, heroPrimaryTrend.length, t]);

  const activeClientsDelta = deltaMap.get("users.distinctClientsActiveInPeriod");
  const activeDeltaParts = partsForPath("users.distinctClientsActiveInPeriod");
  const activeDeltaPositive = activeClientsDelta ? activeClientsDelta.delta >= 0 : true;

  const heroDeltaContent =
    activeDeltaParts !== null ? (
      <StatsCompareDeltaPill
        parts={activeDeltaParts}
        deltaPositive={activeDeltaPositive}
        className="self-start px-2.5 py-1"
      />
    ) : null;

  const heroChart =
    heroPrimaryTrend.length > 0 ? (
      <StatsHubDualLineChart
        primaryValues={heroPrimaryTrend}
        compareValues={heroHasDualTrend ? heroCompareTrend : null}
        primaryColor={MERCHANT_STATS_CHART_PRIMARY_BLUE}
        compareColor={MERCHANT_STATS_CHART_HUB_COMPARE_LINE}
      />
    ) : null;

  const stampsValue = bundle.stamps?.stampsEarnedTotalInPeriod ?? 0;

  const hubInsights = useMemo(() => buildHubStatsInsights(bundle), [bundle]);

  const locationsCount = bundle.locations?.locations?.length ?? 0;
  const compareDeltaCount = bundle.analytics?.metricDeltas?.length ?? 0;
  const compareBadge = compareMode !== "none" ? String(compareDeltaCount) : undefined;

  return (
    <View className="gap-5">
      <StatsHubHeroCard
        titleRow={heroTitleRow}
        scopeLine={scopePillLabel}
        value={formatInteger(bundle.users?.distinctClientsActiveInPeriod ?? 0, locale)}
        deltaContent={heroDeltaContent}
        chart={heroChart}
        chartFootnote={heroChartFootnote}
      />

      <View className="flex-row flex-wrap gap-2">
        <StatsHubMetricTile
          label={t("MerchantStats.hubMetricShortNewCards")}
          value={formatInteger(bundle.users?.newLoyaltyCardsIssuedInPeriod ?? 0, locale)}
          locale={locale}
          deltaRow={deltaMap.get("users.newLoyaltyCardsIssuedInPeriod")}
          showDelta={showDelta}
          notApplicableLabel={deltaNa}
        />
        <StatsHubMetricTile
          label={t("MerchantStats.hubMetricShortRewards")}
          value={formatInteger(bundle.rewards?.userRewardsRedeemedInPeriod ?? 0, locale)}
          locale={locale}
          deltaRow={deltaMap.get("rewards.userRewardsRedeemedInPeriod")}
          showDelta={showDelta}
          notApplicableLabel={deltaNa}
        />
        <StatsHubMetricTile
          label={t("MerchantStats.hubMetricShortStamps")}
          value={formatCompactInt(stampsValue, locale)}
          locale={locale}
          deltaRow={deltaMap.get("stamps.stampsEarnedTotalInPeriod")}
          showDelta={showDelta}
          notApplicableLabel={deltaNa}
        />
        <StatsHubMetricTile
          label={t("MerchantStats.hubMetricShortStreaks")}
          value={formatInteger(bundle.streaks?.totalVisitsInPeriod ?? 0, locale)}
          locale={locale}
          deltaRow={deltaMap.get("streaks.totalVisitsInPeriod")}
          showDelta={showDelta}
          notApplicableLabel={deltaNa}
        />
      </View>

      <StatsInsightList items={hubInsights} />

      <View className="gap-3 px-0.5">
        <Typography variant="text-16-bold" className="text-gray-900">
          {t("MerchantStats.hubDetailedReports")}
        </Typography>
        <DashboardMenuItem
          className="border border-gray-100-light shadow-settings-card"
          label={t("MerchantStats.navClients")}
          badge={formatCompactInt(bundle.users?.distinctClientsActiveInPeriod ?? 0, locale)}
          onPress={() => router.push("/company/stats/clients")}
        />
        <DashboardMenuItem
          className="border border-gray-100-light shadow-settings-card"
          label={t("MerchantStats.navPointsRewards")}
          badge={formatCompactInt(bundle.rewards?.userRewardsCreatedInPeriod ?? 0, locale)}
          onPress={() => router.push("/company/stats/points-rewards")}
        />
        <DashboardMenuItem
          className="border border-gray-100-light shadow-settings-card"
          label={t("MerchantStats.navStoresCoupons")}
          badge={formatCompactInt(locationsCount, locale)}
          onPress={() => router.push("/company/stats/stores-coupons")}
        />
        <DashboardMenuItem
          className="border border-gray-100-light shadow-settings-card"
          label={t("MerchantStats.navStreaks")}
          badge={formatCompactInt(bundle.streaks?.totalVisitsInPeriod ?? 0, locale)}
          onPress={() => router.push("/company/stats/streaks")}
        />
        <DashboardMenuItem
          className="border border-gray-100-light shadow-settings-card"
          label={t("MerchantStats.navCompare")}
          badge={compareBadge}
          onPress={() => router.push("/company/stats/compare")}
        />
      </View>
    </View>
  );
};
