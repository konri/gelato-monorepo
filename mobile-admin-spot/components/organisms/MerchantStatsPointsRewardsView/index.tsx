import { Typography } from "@/components/atoms/Typography";
import { StatsCompareDeltaPill } from "@/components/molecules/StatsCompareDeltaPill";
import { StatsDonutChart } from "@/components/molecules/StatsDonutChart";
import { StatsConversionFunnelStep, StatsFunnelConnector } from "@/components/molecules/StatsFunnelBlocks";
import { StatsInsightList } from "@/components/molecules/StatsInsightList";
import { StatsMetricHeroCard } from "@/components/molecules/StatsMetricHeroCard";
import { StatsMetricPairBarChart } from "@/components/molecules/StatsMetricPairBarChart";
import { InfoBanner } from "@/components/molecules/InfoBanner";
import { StatsSectionCard } from "@/components/molecules/StatsSectionCard";
import { StatsScreenHeading } from "@/components/molecules/StatsScreenHeading";
import { formatInteger, formatPercent } from "@/utils/merchantStatsFormat";
import { merchantStatsRewardSourceLabel } from "@/utils/merchantStatsRewardSourceLabel";
import { maxPositiveOrOne } from "@/utils/maxPositiveOrOne";
import { useMerchantStatsChartLayout } from "@/hooks/useMerchantStatsChartLayout";
import { useMerchantStatsKpiDelta } from "@/hooks/useMerchantStatsKpiDelta";
import type { MerchantStatsBundleData } from "@/shared/api-client/src/graphql/queries/merchantStats";
import { buildPointsRewardsStatsInsights } from "@/utils/merchantStatsInsights";
import React, { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

const STATS_REWARDS_SOURCE_PALETTE = [
  "#1A4196",
  "#059669",
  "#D97706",
  "#7C3AED",
  "#DC2626",
] as const;

type MerchantStatsPointsRewardsViewProps = {
  bundle: MerchantStatsBundleData;
  screenSubtitle: string;
};

export const MerchantStatsPointsRewardsView = ({
  bundle,
  screenSubtitle,
}: MerchantStatsPointsRewardsViewProps) => {
  const { t } = useTranslation();
  const { deltaMap, showDelta, deltaNa, locale, partsForPath } = useMerchantStatsKpiDelta(
    bundle.analytics,
  );
  const { pairBarChartWidth, donutPointsRewards } = useMerchantStatsChartLayout();
  const points = bundle.points;
  const rewards = bundle.rewards;
  const stamps = bundle.stamps;
  const cards = bundle.cards;

  const earnedDelta = deltaMap.get("points.merchantPointsEarnedInPeriod");
  const spentDelta = deltaMap.get("points.merchantPointsSpentInPeriod");
  const earnedParts = partsForPath("points.merchantPointsEarnedInPeriod");
  const spentParts = partsForPath("points.merchantPointsSpentInPeriod");
  const earnedUp = earnedDelta ? earnedDelta.delta >= 0 : true;
  const spentUp = spentDelta ? spentDelta.delta >= 0 : true;

  const avgBalance = points?.averageAvailablePointsPerBalance ?? 0;

  const formatPointsBar = useCallback(
    (n: number) => {
      if (!Number.isFinite(n)) {
        return "—";
      }
      return formatInteger(Math.round(n), locale);
    },
    [locale],
  );

  const rewardsBySource = useMemo(() => {
    const raw = rewards?.userRewardsBySourceTypeInPeriod;
    if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
      return [];
    }
    const entries = Object.entries(raw)
      .map(([k, v]) => {
        const num = typeof v === "number" ? v : Number(v);
        return { k, v: num };
      })
      .filter((x) => Number.isFinite(x.v) && x.v > 0)
      .sort((a, b) => b.v - a.v)
      .slice(0, 5);
    const total = entries.reduce((acc, e) => acc + e.v, 0);
    return entries.map((e, i) => ({
      key: e.k,
      value: e.v,
      color: STATS_REWARDS_SOURCE_PALETTE[i % STATS_REWARDS_SOURCE_PALETTE.length],
      share: total > 0 ? e.v / total : 0,
    }));
  }, [rewards?.userRewardsBySourceTypeInPeriod]);

  const pointsInsights = useMemo(() => buildPointsRewardsStatsInsights(bundle), [bundle]);

  const milestonesClaimed = stamps?.milestonesClaimedInPeriod ?? 0;
  const milestonesRedeemed = stamps?.milestonesRedeemedInPeriod ?? 0;
  const milestoneRealizeRate = milestonesClaimed > 0 ? milestonesRedeemed / milestonesClaimed : 0;
  const milestoneDropPct =
    milestonesClaimed > 0 ? Math.round((1 - milestonesRedeemed / milestonesClaimed) * 100) : 0;

  const topRewardsSlice = rewards?.topRewardsInPeriod?.slice(0, 8) ?? [];
  const maxRewardCount = maxPositiveOrOne(...topRewardsSlice.map((r) => r.count));

  const bundleRedemptionRate =
    rewards?.redemptionRate !== undefined &&
    rewards.redemptionRate !== null &&
    Number.isFinite(rewards.redemptionRate)
      ? rewards.redemptionRate
      : null;

  return (
    <View className="gap-5">
      <StatsScreenHeading title={t("MerchantStats.navPointsRewards")} subtitle={screenSubtitle} />

      {bundle.analytics?.storeMetricCoverage === "STORE_SCOPED_PARTIAL" ? (
        <InfoBanner variant="compact" text={t("MerchantStats.partialCoverageStatsNote")} />
      ) : null}

      <StatsInsightList items={pointsInsights} />

      {points ? (
        <StatsSectionCard
          title={t("MerchantStats.pointsFlowTitle")}
          subtitle={t("MerchantStats.pointsFlowSubtitle")}
        >
          <View className="flex-row gap-2 items-stretch">
            <View className="flex-1">
              <Typography variant="text-12-bold" className="text-emerald-700 uppercase">
                {t("MerchantStats.pointsEarned")}
              </Typography>
              <Typography variant="text-20-bold" className="text-gray-900 mt-1">
                {formatInteger(points.merchantPointsEarnedInPeriod, locale)}
              </Typography>
              {earnedParts ? (
                <StatsCompareDeltaPill parts={earnedParts} deltaPositive={earnedUp} className="mt-1 self-start" />
              ) : null}
            </View>
            <View className="w-px bg-gray-200 self-stretch my-1" />
            <View className="flex-1 items-end">
              <Typography variant="text-12-bold" className="text-red-600 uppercase">
                {t("MerchantStats.pointsSpent")}
              </Typography>
              <Typography variant="text-20-bold" className="text-gray-900 mt-1">
                {formatInteger(points.merchantPointsSpentInPeriod, locale)}
              </Typography>
              {spentParts ? (
                <StatsCompareDeltaPill parts={spentParts} deltaPositive={spentUp} className="mt-1 self-end" />
              ) : null}
            </View>
          </View>
          <View className="mt-4 pt-3 border-t border-gray-100">
            <Typography variant="text-12-semibold" className="text-gray-800 mb-2">
              {t("MerchantStats.pointsFlowBarTitle")}
            </Typography>
            <StatsMetricPairBarChart
              labelColumnWidth={0}
              width={pairBarChartWidth}
              items={[
                {
                  label: "",
                  current: points.merchantPointsEarnedInPeriod,
                  previous: points.merchantPointsSpentInPeriod,
                },
              ]}
              columnALabel={t("MerchantStats.pointsEarned")}
              columnBLabel={t("MerchantStats.pointsSpent")}
              formatValue={formatPointsBar}
              barBColor="#DC2626"
            />
          </View>
          <View className="mt-3 bg-gray-50 rounded-xl p-3 border border-gray-100 gap-2">
            <View className="flex-row justify-between items-center">
              <Typography variant="text-12-regular" className="text-gray-600">
                {t("MerchantStats.pointsLiabilityTotal")}
              </Typography>
              <Typography variant="text-16-bold" className="text-blue-900">
                {formatInteger(points.totalAvailablePointsLiability, locale)}{" "}
                {t("MerchantStats.pointsUnitAbbrev")}
              </Typography>
            </View>
            <Typography variant="text-12-regular" className="text-gray-500">
              {t("MerchantStats.pointsAvgPerUser", {
                value: formatInteger(Math.round(avgBalance), locale),
                unit: t("MerchantStats.pointsUnitAbbrev"),
              })}
            </Typography>
            <Typography variant="text-12-regular" className="text-gray-700 leading-snug">
              {t("MerchantStats.pointsBalancesFootnote")}
            </Typography>
          </View>
        </StatsSectionCard>
      ) : null}

      {points ? (
        <View className="flex-row flex-wrap gap-2">
          <View className="flex-1 min-w-2/5 bg-white rounded-2xl p-3.5 border border-gray-100-light shadow-settings-card">
            <Typography variant="text-12-semibold" className="text-gray-600 leading-snug">
              {t("MerchantStats.pointsUsersWithBalance")}
            </Typography>
            <Typography variant="text-20-bold" className="text-gray-900 mt-1">
              {formatInteger(points.usersWithMerchantPointBalance, locale)}
            </Typography>
          </View>
          <View className="flex-1 min-w-2/5 bg-white rounded-2xl p-3.5 border border-gray-100-light shadow-settings-card">
            <Typography variant="text-12-semibold" className="text-gray-600 leading-snug">
              {t("MerchantStats.pointsLedgerRows")}
            </Typography>
            <Typography variant="text-20-bold" className="text-gray-900 mt-1">
              {formatInteger(points.merchantPointLedgerRowsInPeriod, locale)}
            </Typography>
            {points.merchantPointsBonusInPeriod > 0 ? (
              <Typography variant="text-12-regular" className="text-gray-600 mt-2 px-2.5 py-1 rounded-full bg-gray-50 self-start">
                {t("MerchantStats.pointsBonusHint", {
                  count: points.merchantPointsBonusInPeriod,
                })}
              </Typography>
            ) : null}
          </View>
        </View>
      ) : null}

      {rewards && rewardsBySource.length > 0 ? (
        <StatsSectionCard title={t("MerchantStats.rewardsBySourceTitle")}>
          <View className="flex-row items-start gap-4">
            <View className="shrink-0">
              <StatsDonutChart
                size={donutPointsRewards}
                thickness={22}
                segments={rewardsBySource.map((s) => ({ value: s.value, color: s.color }))}
              />
            </View>
            <View className="flex-1 min-w-0 gap-2 pt-1">
              {rewardsBySource.map((s) => (
                <View key={s.key} className="gap-0.5">
                  <View className="flex-row items-center gap-2">
                    <View className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                    <Typography variant="text-12-semibold" className="text-gray-800 flex-1" numberOfLines={2}>
                      {merchantStatsRewardSourceLabel(t, s.key)}
                    </Typography>
                  </View>
                  <Typography variant="text-12-bold" className="text-gray-700 pl-4">
                    {formatInteger(Math.round(s.value), locale)} · {formatPercent(s.share, locale)}
                  </Typography>
                </View>
              ))}
            </View>
          </View>
        </StatsSectionCard>
      ) : null}

      {stamps && milestonesClaimed > 0 ? (
        <StatsMetricHeroCard
          accent="blue"
          label={t("MerchantStats.milestonesFunnelHeroLabel")}
          value={formatPercent(milestoneRealizeRate, locale)}
          detail={
            <Typography variant="text-12-regular" className="text-gray-700">
              {t("MerchantStats.milestonesFunnelHeroDetail")}
            </Typography>
          }
        />
      ) : null}

      {stamps && milestonesClaimed > 0 ? (
        <StatsSectionCard title={t("MerchantStats.milestonesFunnelTitle")}>
          <View className="gap-0.5">
            <StatsConversionFunnelStep
              label={t("MerchantStats.kpiMilestonesClaimed")}
              valueNumeric={formatInteger(milestonesClaimed, locale)}
              shareLabel={formatPercent(1, locale)}
              fillRatio={1}
              fillClassName="bg-blue-50"
            />
            <StatsFunnelConnector caption={t("MerchantStats.funnelDropoff", { percent: milestoneDropPct })} />
            <StatsConversionFunnelStep
              label={t("MerchantStats.kpiMilestonesRedeemed")}
              valueNumeric={formatInteger(milestonesRedeemed, locale)}
              shareLabel={formatPercent(milestoneRealizeRate, locale)}
              fillRatio={milestoneRealizeRate}
              variant="emphasis"
            />
          </View>
        </StatsSectionCard>
      ) : null}

      {rewards ? (
        <StatsSectionCard title={t("MerchantStats.topRewards")}>
          {topRewardsSlice.map((row, index) => {
            const rate = row.redemptionRate;
            const rateLabel =
              rate !== undefined && rate !== null && Number.isFinite(rate)
                ? formatPercent(rate, locale)
                : null;
            const countBarW = (row.count / maxRewardCount) * 100;
            return (
              <View
                key={`${row.rewardId ?? "n"}-${row.title}-${index}`}
                className="gap-1.5 py-2 border-b border-gray-100"
              >
                <View className="flex-row items-center gap-2">
                  <View
                    className={`w-6 h-6 rounded-full items-center justify-center ${index === 0 ? "bg-blue-900" : "bg-blue-100"}`}
                  >
                    <Typography
                      variant="text-12-bold"
                      className={index === 0 ? "text-white" : "text-blue-900"}
                    >
                      {String(index + 1)}
                    </Typography>
                  </View>
                  <View className="flex-1 pr-2">
                    <Typography variant="text-12-semibold" className="text-gray-900">
                      {row.title}
                    </Typography>
                    <Typography variant="text-12-regular" className="text-gray-600">
                      {merchantStatsRewardSourceLabel(t, row.sourceType)} ·{" "}
                      {formatInteger(row.count, locale)}
                    </Typography>
                  </View>
                  {rateLabel ? (
                    <View className="items-end gap-0.5">
                      <Typography variant="text-14-bold" className="text-emerald-700">
                        {rateLabel}
                      </Typography>
                      <Typography variant="text-12-semibold" className="text-gray-600">
                        {t("MerchantStats.kpiRedemptionRate")}
                      </Typography>
                      {bundleRedemptionRate !== null && bundleRedemptionRate > 0 ? (
                        <Typography variant="text-12-regular" className="text-gray-500">
                          {t("MerchantStats.rewardVsBundleAvgShort", {
                            value: formatPercent(bundleRedemptionRate, locale),
                          })}
                        </Typography>
                      ) : null}
                    </View>
                  ) : (
                    <Typography variant="text-14-bold" className="text-gray-900">
                      {formatInteger(row.count, locale)}
                    </Typography>
                  )}
                </View>
                <View className="h-2 bg-gray-100 rounded-full overflow-hidden pl-8">
                  <View className="h-full bg-blue-300 rounded-full" style={{ width: `${countBarW}%` }} />
                </View>
              </View>
            );
          })}
        </StatsSectionCard>
      ) : null}

      {stamps || cards ? (
        <StatsSectionCard title={t("MerchantStats.sectionCardsStamps")}>
          <View className="gap-2">
            {cards ? (
              <View className="flex-row justify-between py-2 border-b border-gray-100">
                <Typography variant="text-12-regular" className="text-gray-600">
                  {t("MerchantStats.kpiAvgStampsActive")}
                </Typography>
                <Typography variant="text-12-bold" className="text-gray-900">
                  {formatInteger(Math.round(cards.averageStampsCollectedOnActiveCards), locale)}
                </Typography>
              </View>
            ) : null}
            {stamps ? (
              milestonesClaimed > 0 ? null : (
                <>
                  <View className="flex-row justify-between py-2 border-b border-gray-100">
                    <Typography variant="text-12-regular" className="text-gray-600">
                      {t("MerchantStats.kpiMilestonesClaimed")}
                    </Typography>
                    <Typography variant="text-12-bold" className="text-gray-900">
                      {formatInteger(stamps.milestonesClaimedInPeriod, locale)}
                    </Typography>
                  </View>
                  <View className="flex-row justify-between py-2 border-b border-gray-100">
                    <Typography variant="text-12-regular" className="text-gray-600">
                      {t("MerchantStats.kpiMilestonesRedeemed")}
                    </Typography>
                    <View className="items-end">
                      <Typography variant="text-12-bold" className="text-gray-900">
                        {formatInteger(stamps.milestonesRedeemedInPeriod, locale)}
                      </Typography>
                      {stamps.milestonesClaimedInPeriod > 0 ? (
                        <Typography variant="text-12-bold" className="text-emerald-700">
                          {formatPercent(
                            stamps.milestonesRedeemedInPeriod / stamps.milestonesClaimedInPeriod,
                            locale,
                          )}
                        </Typography>
                      ) : null}
                    </View>
                  </View>
                </>
              )
            ) : null}
            {cards ? (
              <View className="flex-row justify-between py-2">
                <Typography variant="text-12-regular" className="text-gray-600">
                  {t("MerchantStats.kpiCardsAbandonedPartial")}
                </Typography>
                <Typography variant="text-12-bold" className="text-red-600">
                  {formatInteger(cards.loyaltyCardsAbandonedPartial, locale)}
                </Typography>
              </View>
            ) : null}
          </View>
        </StatsSectionCard>
      ) : null}
    </View>
  );
};
