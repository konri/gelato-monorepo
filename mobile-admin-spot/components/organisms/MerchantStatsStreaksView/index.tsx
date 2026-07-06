import { Typography } from "@/components/atoms/Typography";
import { StatsConversionFunnelStep, StatsFunnelConnector } from "@/components/molecules/StatsFunnelBlocks";
import { StatsInsightList } from "@/components/molecules/StatsInsightList";
import { StatsKpiMetricTile } from "@/components/molecules/StatsKpiMetricTile";
import { StatsSectionCard } from "@/components/molecules/StatsSectionCard";
import { StatsScreenHeading } from "@/components/molecules/StatsScreenHeading";
import { formatInteger, formatPercent } from "@/utils/merchantStatsFormat";
import { useMerchantStatsKpiDelta } from "@/hooks/useMerchantStatsKpiDelta";
import type { MerchantStatsBundleData } from "@/shared/api-client/src/graphql/queries/merchantStats";
import { buildStreaksStatsInsights } from "@/utils/merchantStatsInsights";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

const kpiBoxClass =
  "flex-1 min-w-40 max-w-1/2 grow bg-white rounded-2xl p-3.5 border border-gray-100-light shadow-settings-card";

type MerchantStatsStreaksViewProps = {
  bundle: MerchantStatsBundleData;
  screenSubtitle: string;
};

const programBorderClass = (index: number): string => {
  if (index === 0) {
    return "border-l-4 border-blue-900";
  }
  if (index === 1) {
    return "border-l-4 border-purple-600";
  }
  return "border-l-4 border-gray-200";
};

export const MerchantStatsStreaksView = ({
  bundle,
  screenSubtitle,
}: MerchantStatsStreaksViewProps) => {
  const { t } = useTranslation();
  const { deltaMap, showDelta, deltaNa, locale } = useMerchantStatsKpiDelta(bundle.analytics);
  const streaks = bundle.streaks;

  const streakInsights = useMemo(() => buildStreaksStatsInsights(bundle), [bundle]);

  const globalVisits = streaks?.totalVisitsInPeriod ?? 0;
  const globalClaims = streaks?.totalRewardClaimsInPeriod ?? 0;
  const globalDropPct =
    globalVisits > 0 ? Math.round((1 - globalClaims / globalVisits) * 100) : 0;
  const globalConvShare = globalVisits > 0 ? globalClaims / globalVisits : 0;

  return (
    <View className="gap-5">
      <StatsScreenHeading title={t("MerchantStats.navStreaks")} subtitle={screenSubtitle} />

      <StatsInsightList items={streakInsights} />

      {streaks ? (
        <View className="flex-row flex-wrap gap-2">
          <StatsKpiMetricTile
            label={t("MerchantStats.streakProgramsActive")}
            value={streaks.activeStreakPrograms}
            locale={locale}
            showDelta={false}
            notApplicableLabel={deltaNa}
            boxClassName={kpiBoxClass}
          />
          <StatsKpiMetricTile
            label={t("MerchantStats.kpiStreakVisits")}
            value={streaks.totalVisitsInPeriod}
            locale={locale}
            deltaRow={deltaMap.get("streaks.totalVisitsInPeriod")}
            showDelta={showDelta}
            notApplicableLabel={deltaNa}
            boxClassName={kpiBoxClass}
          />
          <StatsKpiMetricTile
            label={t("MerchantStats.streakAvgCurrent")}
            value={streaks.averageCurrentStreak}
            displayValue={streaks.averageCurrentStreak.toFixed(1)}
            locale={locale}
            showDelta={false}
            notApplicableLabel={deltaNa}
            boxClassName={kpiBoxClass}
          />
          <StatsKpiMetricTile
            label={t("MerchantStats.streakAvgLongest")}
            value={streaks.averageLongestStreak}
            displayValue={streaks.averageLongestStreak.toFixed(1)}
            locale={locale}
            showDelta={false}
            notApplicableLabel={deltaNa}
            boxClassName={kpiBoxClass}
          />
        </View>
      ) : null}

      {streaks && globalVisits > 0 ? (
        <StatsSectionCard title={t("MerchantStats.streaksFunnelGlobalTitle")}>
          <View className="gap-0.5">
            <StatsConversionFunnelStep
              label={t("MerchantStats.streakColVisits")}
              valueNumeric={formatInteger(globalVisits, locale)}
              shareLabel={formatPercent(1, locale)}
              fillRatio={1}
              fillClassName="bg-blue-50"
            />
            <StatsFunnelConnector caption={t("MerchantStats.funnelDropoff", { percent: globalDropPct })} />
            <StatsConversionFunnelStep
              label={t("MerchantStats.streakColRewards")}
              valueNumeric={formatInteger(globalClaims, locale)}
              shareLabel={formatPercent(globalConvShare, locale)}
              fillRatio={globalConvShare}
              variant="emphasis"
            />
          </View>
        </StatsSectionCard>
      ) : null}

      {streaks && streaks.programBreakdown.length > 0 ? (
        <StatsSectionCard title={t("MerchantStats.streakBreakdownTitle")}>
          <View className="gap-3">
            {streaks.programBreakdown.map((program, index) => {
              const conv =
                program.visitsInPeriod > 0
                  ? program.rewardClaimsInPeriod / program.visitsInPeriod
                  : 0;
              const programDropPct =
                program.visitsInPeriod > 0
                  ? Math.round((1 - program.rewardClaimsInPeriod / program.visitsInPeriod) * 100)
                  : 0;
              return (
                <View
                  key={program.streakProgramId}
                  className={`bg-white rounded-2xl p-3.5 border border-gray-100-light shadow-settings-card pl-2 ${programBorderClass(index)}`}
                >
                  <View className="flex-row justify-between items-start gap-2 mb-2">
                    <Typography
                      variant="text-14-bold"
                      className="text-gray-900 flex-1 min-w-0 pr-2 leading-snug"
                      numberOfLines={3}
                      ellipsizeMode="tail"
                    >
                      {program.name}
                    </Typography>
                    <View className="px-2 py-0.5 rounded-full bg-blue-50 border border-blue-100 shrink-0">
                      <Typography variant="text-12-bold" className="text-blue-900">
                        {t("MerchantStats.streakProgramActive")}
                      </Typography>
                    </View>
                  </View>
                  <View className="flex-row gap-2">
                    <View className="flex-1 bg-blue-50 rounded-lg p-2 items-center">
                      <Typography variant="text-16-bold" className="text-blue-900">
                        {formatInteger(program.visitsInPeriod, locale)}
                      </Typography>
                      <Typography variant="text-12-semibold" className="text-blue-900">
                        {t("MerchantStats.streakColVisits")}
                      </Typography>
                    </View>
                    <View className="flex-1 bg-gray-50 rounded-lg p-2 items-center">
                      <Typography variant="text-16-bold" className="text-gray-900">
                        {formatInteger(program.distinctUsersInPeriod, locale)}
                      </Typography>
                      <Typography variant="text-12-semibold" className="text-gray-600">
                        {t("MerchantStats.streakColUsers")}
                      </Typography>
                    </View>
                    <View className="flex-1 bg-emerald-50 rounded-lg p-2 items-center">
                      <Typography variant="text-16-bold" className="text-emerald-700">
                        {formatInteger(program.rewardClaimsInPeriod, locale)}
                      </Typography>
                      <Typography variant="text-12-semibold" className="text-emerald-800">
                        {t("MerchantStats.streakColRewards")}
                      </Typography>
                    </View>
                  </View>
                  <View className="mt-3 gap-0.5">
                    <Typography variant="text-12-semibold" className="text-gray-600 uppercase tracking-wide mb-1.5">
                      {t("MerchantStats.streakProgramConversion")}
                    </Typography>
                    <StatsConversionFunnelStep
                      label={t("MerchantStats.streakColVisits")}
                      valueNumeric={formatInteger(program.visitsInPeriod, locale)}
                      shareLabel={formatPercent(1, locale)}
                      fillRatio={1}
                      fillClassName="bg-blue-50"
                    />
                    {program.visitsInPeriod > 0 ? (
                      <StatsFunnelConnector
                        caption={t("MerchantStats.funnelDropoff", { percent: programDropPct })}
                      />
                    ) : null}
                    <StatsConversionFunnelStep
                      label={t("MerchantStats.streakColRewards")}
                      valueNumeric={formatInteger(program.rewardClaimsInPeriod, locale)}
                      shareLabel={formatPercent(conv, locale)}
                      fillRatio={conv}
                      variant="emphasis"
                    />
                  </View>
                </View>
              );
            })}
          </View>
        </StatsSectionCard>
      ) : null}
    </View>
  );
};
