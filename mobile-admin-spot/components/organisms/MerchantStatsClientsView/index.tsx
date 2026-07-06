import { Typography } from "@/components/atoms/Typography";
import { StatsDonutChart } from "@/components/molecules/StatsDonutChart";
import { StatsConversionFunnelStep, StatsFunnelConnector } from "@/components/molecules/StatsFunnelBlocks";
import { StatsCompareDeltaPill } from "@/components/molecules/StatsCompareDeltaPill";
import { StatsInsightList } from "@/components/molecules/StatsInsightList";
import { StatsMetricHeroCard } from "@/components/molecules/StatsMetricHeroCard";
import { StatsSectionCard } from "@/components/molecules/StatsSectionCard";
import { StatsScreenHeading } from "@/components/molecules/StatsScreenHeading";
import { StatsWeekdayBarChart } from "@/components/molecules/StatsWeekdayBarChart";
import { formatInteger, formatPercent } from "@/utils/merchantStatsFormat";
import { maxPositiveOrOne } from "@/utils/maxPositiveOrOne";
import { aggregateTrendSeriesByWeekday } from "@/utils/merchantStatsTrendUtils";
import type { MerchantStatsBundleData } from "@/shared/api-client/src/graphql/queries/merchantStats";
import { useMerchantStatsChartLayout } from "@/hooks/useMerchantStatsChartLayout";
import { useMerchantStatsKpiDelta } from "@/hooks/useMerchantStatsKpiDelta";
import { buildClientsStatsInsights } from "@/utils/merchantStatsInsights";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

type MerchantStatsClientsViewProps = {
  bundle: MerchantStatsBundleData;
  screenSubtitle: string;
};

export const MerchantStatsClientsView = ({ bundle, screenSubtitle }: MerchantStatsClientsViewProps) => {
  const { t } = useTranslation();
  const { deltaMap, showDelta, deltaNa, locale, partsForPath } = useMerchantStatsKpiDelta(
    bundle.analytics,
  );
  const { donutClients, contentWidth } = useMerchantStatsChartLayout();
  const users = bundle.users;
  const funnel = bundle.funnels;
  const rewards = bundle.rewards;
  const trendsSeries = bundle.trends?.series;
  const granularity = bundle.trends?.granularity;

  const clientInsights = useMemo(() => buildClientsStatsInsights(bundle), [bundle]);

  const active = users?.distinctClientsActiveInPeriod ?? 0;
  const returning = users?.returningClientsActiveInPeriod ?? 0;
  const newClients = users?.newClientsFirstActivityInPeriod ?? 0;
  const retShare = active > 0 ? returning / active : 0;
  const newShare = active > 0 ? newClients / active : 0;

  const weekdayBuckets = useMemo(
    () => aggregateTrendSeriesByWeekday(trendsSeries ?? [], "ordersCreated"),
    [trendsSeries],
  );
  const weekdayLabels = useMemo(
    () => [
      t("MerchantStats.weekdayShortMon"),
      t("MerchantStats.weekdayShortTue"),
      t("MerchantStats.weekdayShortWed"),
      t("MerchantStats.weekdayShortThu"),
      t("MerchantStats.weekdayShortFri"),
      t("MerchantStats.weekdayShortSat"),
      t("MerchantStats.weekdayShortSun"),
    ],
    [t],
  );

  const usersSnapshotWarningCount = users?.clientsActiveWithoutActivitySnapshot ?? 0;

  const activeDelta = deltaMap.get("users.distinctClientsActiveInPeriod");
  const activeDeltaParts = partsForPath("users.distinctClientsActiveInPeriod");
  const activeDeltaPositive = activeDelta ? activeDelta.delta >= 0 : true;

  const shareCompletedDelta = deltaMap.get("funnels.stampCardFunnel.shareCompleted");
  const shareCompletedDeltaParts = partsForPath("funnels.stampCardFunnel.shareCompleted");
  const shareCompletedDeltaPositive = shareCompletedDelta ? shareCompletedDelta.delta >= 0 : true;

  const stampTotal = funnel?.stampCardFunnel.cardsTotal ?? 0;
  const withStamp = funnel?.stampCardFunnel.cardsWithAtLeastOneStamp ?? 0;
  const completed = funnel?.stampCardFunnel.cardsCompleted ?? 0;
  const redeemed = rewards?.userRewardsRedeemedInPeriod ?? 0;

  const completionShare = stampTotal > 0 ? completed / stampTotal : 0;
  const dropStampToDone =
    withStamp > 0 ? Math.round((1 - completed / withStamp) * 100) : 0;

  const funnelMaxScale = maxPositiveOrOne(withStamp, completed, redeemed);

  return (
    <View className="gap-5">
      <StatsScreenHeading title={t("MerchantStats.navClients")} subtitle={screenSubtitle} />

      {funnel && stampTotal > 0 ? (
        <StatsMetricHeroCard
          accent="blue"
          label={t("MerchantStats.clientsFunnelHeroLabel")}
          value={formatPercent(completionShare, locale)}
          detail={
            <View className="flex-row flex-wrap items-center gap-2">
              {shareCompletedDeltaParts && shareCompletedDeltaParts.percentLine !== null ? (
                <StatsCompareDeltaPill
                  parts={shareCompletedDeltaParts}
                  deltaPositive={shareCompletedDeltaPositive}
                  className="self-start px-2.5 py-1"
                  contextSuffix={t("MerchantStats.clientsVsPrev")}
                />
              ) : null}
              <Typography variant="text-12-regular" className="text-gray-500">
                {t("MerchantStats.funnelCardsTotal")}: {formatInteger(stampTotal, locale)}
              </Typography>
            </View>
          }
        />
      ) : null}

      {users ? (
        <StatsMetricHeroCard
          accent="blue"
          label={t("MerchantStats.clientsHeroLabel")}
          value={formatInteger(active, locale)}
          detail={
            activeDeltaParts && activeDeltaParts.percentLine !== null ? (
              <StatsCompareDeltaPill
                parts={activeDeltaParts}
                deltaPositive={activeDeltaPositive}
                className="mt-2 self-start px-3 py-1"
                contextSuffix={t("MerchantStats.clientsVsPrev")}
              />
            ) : null
          }
        />
      ) : null}

      {users ? (
        <StatsSectionCard title={t("MerchantStats.sectionUsers")}>
          <View className="gap-3">
            <View className="flex-row gap-3">
              <View className="flex-1 min-w-0">
                <Typography variant="text-12-semibold" className="text-gray-600 uppercase tracking-wide">
                  {t("MerchantStats.kpiReturningClients")}
                </Typography>
                <Typography variant="text-20-bold" className="text-blue-900 mt-1">
                  {formatInteger(returning, locale)}
                </Typography>
                <Typography variant="text-12-bold" className="text-blue-900 mt-1">
                  {t("MerchantStats.returningShareOfActive", {
                    value: formatPercent(retShare, locale),
                  })}
                </Typography>
              </View>
              <View className="flex-1 min-w-0 items-end">
                <Typography
                  variant="text-12-semibold"
                  className="text-gray-600 uppercase tracking-wide text-right"
                >
                  {t("MerchantStats.kpiNewClientsFirstActivity")}
                </Typography>
                <Typography variant="text-20-bold" className="text-purple-700 mt-1 text-right">
                  {formatInteger(newClients, locale)}
                </Typography>
                <Typography variant="text-12-bold" className="text-purple-700 mt-1 text-right">
                  {t("MerchantStats.newShareOfActive", {
                    value: formatPercent(newShare, locale),
                  })}
                </Typography>
              </View>
            </View>
            <View className="h-2.5 bg-purple-200 rounded-full overflow-hidden">
              <View
                className="h-full bg-blue-900 rounded-full"
                style={{ width: `${Math.min(100, retShare * 100)}%` }}
              />
            </View>
            {active > 0 ? (
              <View className="mt-4 pt-3 border-t border-gray-100 gap-2">
                <Typography variant="text-12-semibold" className="text-gray-800">
                  {t("MerchantStats.clientsCompositionTitle")}
                </Typography>
                <View className="flex-row items-center gap-4">
                  <View className="shrink-0">
                    <StatsDonutChart
                      size={donutClients}
                      thickness={20}
                      segments={[
                        { value: returning, color: "#1A4196" },
                        { value: newClients, color: "#7C3AED" },
                      ]}
                    />
                  </View>
                  <View className="flex-1 min-w-0 gap-3">
                    <View className="gap-0.5">
                      <View className="flex-row items-center gap-2">
                        <View className="w-2.5 h-2.5 rounded-full bg-blue-900" />
                        <Typography variant="text-12-semibold" className="text-gray-800 flex-1">
                          {t("MerchantStats.kpiReturningClients")}
                        </Typography>
                      </View>
                      <Typography variant="text-14-bold" className="text-gray-900 pl-4">
                        {formatInteger(returning, locale)} · {formatPercent(retShare, locale)}
                      </Typography>
                    </View>
                    <View className="gap-0.5">
                      <View className="flex-row items-center gap-2">
                        <View className="w-2.5 h-2.5 rounded-full bg-[#7C3AED]" />
                        <Typography variant="text-12-semibold" className="text-gray-800 flex-1">
                          {t("MerchantStats.kpiNewClientsFirstActivity")}
                        </Typography>
                      </View>
                      <Typography variant="text-14-bold" className="text-purple-700 pl-4">
                        {formatInteger(newClients, locale)} · {formatPercent(newShare, locale)}
                      </Typography>
                    </View>
                  </View>
                </View>
              </View>
            ) : null}
          </View>
        </StatsSectionCard>
      ) : null}

      {usersSnapshotWarningCount > 0 ? (
        <View className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex-row gap-2">
          <Typography variant="text-12-semibold" className="text-amber-900 flex-1">
            {t("MerchantStats.usersSnapshotIncomplete", { count: usersSnapshotWarningCount })}
          </Typography>
        </View>
      ) : null}

      <StatsInsightList items={clientInsights} />

      {funnel && stampTotal > 0 ? (
        <StatsSectionCard
          title={t("MerchantStats.clientsFunnelStepsTitle")}
          subtitle={t("MerchantStats.clientsFunnelStepsFootnote")}
        >
          <View className="gap-0.5">
            <StatsConversionFunnelStep
              label={t("MerchantStats.clientsFunnelStepStampCards")}
              valueNumeric={formatInteger(withStamp, locale)}
              shareLabel={formatPercent(withStamp / funnelMaxScale, locale)}
              fillRatio={withStamp / funnelMaxScale}
              fillClassName="bg-blue-50"
            />
            {withStamp > 0 ? (
              <StatsFunnelConnector caption={t("MerchantStats.funnelDropoff", { percent: dropStampToDone })} />
            ) : null}
            <StatsConversionFunnelStep
              label={t("MerchantStats.clientsFunnelStepAllStamps")}
              valueNumeric={formatInteger(completed, locale)}
              shareLabel={formatPercent(withStamp > 0 ? completed / withStamp : 0, locale)}
              fillRatio={completed / funnelMaxScale}
              fillClassName="bg-blue-100"
            />
            {withStamp > 0 ? (
              <StatsFunnelConnector
                caption={t("MerchantStats.clientsFunnelConnectorRewards", {
                  value: formatInteger(redeemed, locale),
                })}
              />
            ) : null}
            <StatsConversionFunnelStep
              label={t("MerchantStats.clientsFunnelStepRewardsRedeemed")}
              valueNumeric={formatInteger(redeemed, locale)}
              shareLabel={formatPercent(redeemed / funnelMaxScale, locale)}
              fillRatio={redeemed / funnelMaxScale}
              variant="emphasis"
            />
          </View>
        </StatsSectionCard>
      ) : null}

      <StatsSectionCard
        title={t("MerchantStats.weekdayActivityTitle")}
        subtitle={t("MerchantStats.weekdayActivitySubtitle")}
      >
        {granularity === "day" && (trendsSeries?.length ?? 0) > 0 ? (
          <StatsWeekdayBarChart width={contentWidth} values={weekdayBuckets} labels={weekdayLabels} />
        ) : (
          <Typography variant="text-14-semibold" className="text-gray-700 leading-snug">
            {t("MerchantStats.weekdayNeedsDaily")}
          </Typography>
        )}
      </StatsSectionCard>
    </View>
  );
};
