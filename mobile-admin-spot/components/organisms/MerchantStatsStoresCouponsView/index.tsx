import { Typography } from "@/components/atoms/Typography";
import { StatsConversionFunnelStep, StatsFunnelConnector } from "@/components/molecules/StatsFunnelBlocks";
import { StatsInsightList } from "@/components/molecules/StatsInsightList";
import { StatsMetricHeroCard } from "@/components/molecules/StatsMetricHeroCard";
import { StatsSectionCard } from "@/components/molecules/StatsSectionCard";
import { StatsScreenHeading } from "@/components/molecules/StatsScreenHeading";
import { formatInteger, formatPercent } from "@/utils/merchantStatsFormat";
import { merchantStatsCouponTypeLabel } from "@/utils/merchantStatsCouponTypeLabel";
import { maxPositiveOrOne } from "@/utils/maxPositiveOrOne";
import { useMerchantStatsLocale } from "@/hooks/useMerchantStats";
import type { MerchantStatsBundleData } from "@/shared/api-client/src/graphql/queries/merchantStats";
import { buildCouponsStatsInsights } from "@/utils/merchantStatsInsights";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

type MerchantStatsStoresCouponsViewProps = {
  bundle: MerchantStatsBundleData;
  screenSubtitle: string;
};

export const MerchantStatsStoresCouponsView = ({
  bundle,
  screenSubtitle,
}: MerchantStatsStoresCouponsViewProps) => {
  const { t } = useTranslation();
  const locale = useMerchantStatsLocale();
  const sortedLocs = useMemo(() => {
    const list = bundle.locations?.locations ?? [];
    return [...list].sort((a, b) => b.ordersCreatedInPeriod - a.ordersCreatedInPeriod);
  }, [bundle.locations?.locations]);
  const maxOrders = maxPositiveOrOne(...sortedLocs.map((l) => l.ordersCreatedInPeriod));
  const coupons = bundle.coupons;
  const funnel = bundle.funnels;

  const couponInsights = useMemo(() => buildCouponsStatsInsights(bundle), [bundle]);

  const activeCoupons = coupons?.activeCoupons ?? 0;
  const claimed = funnel?.couponFunnel.userCouponsClaimedInPeriod ?? 0;
  const usages = funnel?.couponFunnel.couponUsagesInPeriod ?? 0;
  const claimToUse = funnel?.couponFunnel.claimToUseRate ?? 0;

  const maxFunnelScale = maxPositiveOrOne(activeCoupons, claimed, usages);
  const dropActiveToClaimed =
    activeCoupons > 0
      ? Math.round((1 - Math.min(claimed, activeCoupons) / activeCoupons) * 100)
      : 0;
  const dropClaimedToUsage = claimed > 0 ? Math.round((1 - usages / claimed) * 100) : 0;

  const topSlice = coupons?.topCouponsByUsage?.slice(0, 8) ?? [];
  const maxTopUsage = maxPositiveOrOne(...topSlice.map((r) => r.usageCount));

  return (
    <View className="gap-5">
      <StatsScreenHeading title={t("MerchantStats.navStoresCoupons")} subtitle={screenSubtitle} />

      <StatsInsightList items={couponInsights} />

      {coupons && funnel ? (
        <StatsMetricHeroCard
          accent="emerald"
          label={t("MerchantStats.couponsFunnelHeroLabel")}
          value={formatPercent(claimToUse, locale)}
          detail={
            <Typography variant="text-12-regular" className="text-gray-600">
              {t("MerchantStats.kpiClaimToUse")}
            </Typography>
          }
        />
      ) : null}

      {coupons && funnel ? (
        <StatsSectionCard title={t("MerchantStats.couponsFunnelStepsTitle")}>
          <View className="gap-0.5">
            <StatsConversionFunnelStep
              label={t("MerchantStats.couponsActiveShort")}
              valueNumeric={formatInteger(activeCoupons, locale)}
              shareLabel={formatPercent(activeCoupons / maxFunnelScale, locale)}
              fillRatio={activeCoupons / maxFunnelScale}
              fillClassName="bg-blue-50"
            />
            {activeCoupons > 0 ? (
              <StatsFunnelConnector caption={t("MerchantStats.funnelDropoff", { percent: dropActiveToClaimed })} />
            ) : null}
            <StatsConversionFunnelStep
              label={t("MerchantStats.funnelClaimed")}
              valueNumeric={formatInteger(claimed, locale)}
              shareLabel={formatPercent(claimed / maxFunnelScale, locale)}
              fillRatio={claimed / maxFunnelScale}
              fillClassName="bg-blue-100"
            />
            {claimed > 0 ? (
              <StatsFunnelConnector caption={t("MerchantStats.funnelDropoff", { percent: dropClaimedToUsage })} />
            ) : null}
            <StatsConversionFunnelStep
              label={t("MerchantStats.funnelUsages")}
              valueNumeric={formatInteger(usages, locale)}
              shareLabel={formatPercent(usages / maxFunnelScale, locale)}
              fillRatio={usages / maxFunnelScale}
              variant="emphasis"
            />
          </View>
        </StatsSectionCard>
      ) : null}

      <StatsSectionCard title={t("MerchantStats.sectionLocations")}>
        {sortedLocs.length > 0 ? (
          <View className="gap-2">
            {sortedLocs.map((loc) => (
              <View
                key={loc.merchantStoreId}
                className="flex-row items-center gap-2 py-2 border-b border-gray-100"
              >
                <View className="w-8 h-8 rounded-lg bg-blue-50 items-center justify-center">
                  <Typography variant="text-12-bold" className="text-blue-900">
                    {loc.storeName.slice(0, 1).toUpperCase()}
                  </Typography>
                </View>
                <View className="flex-1 pr-2">
                  <Typography variant="text-12-semibold" className="text-gray-900">
                    {loc.storeName}
                  </Typography>
                  <Typography variant="text-12-regular" className="text-gray-600">
                    {formatInteger(loc.usersWhoFavoritedStore, locale)} {t("MerchantStats.locFavorites").toLowerCase()}
                  </Typography>
                </View>
                <View className="items-end">
                  <Typography variant="text-14-bold" className="text-blue-900">
                    {formatInteger(loc.ordersCreatedInPeriod, locale)}
                  </Typography>
                  <Typography variant="text-12-regular" className="text-gray-600">
                    {t("MerchantStats.locOrders")}
                  </Typography>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <Typography variant="text-14-regular-spaced" className="text-gray-500">
            {t("MerchantStats.locationsEmpty")}
          </Typography>
        )}
      </StatsSectionCard>

      {sortedLocs.length > 0 ? (
        <StatsSectionCard title={t("MerchantStats.locOrders")}>
          <View className="gap-2">
            {sortedLocs.slice(0, 8).map((loc) => {
              const w = (loc.ordersCreatedInPeriod / maxOrders) * 100;
              return (
                <View key={`bar-${loc.merchantStoreId}`} className="flex-row items-center gap-2">
                  <Typography variant="text-12-semibold" className="text-gray-800 w-24" numberOfLines={1}>
                    {loc.storeName}
                  </Typography>
                  <View className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <View className="h-full bg-blue-900 rounded-full" style={{ width: `${w}%` }} />
                  </View>
                  <Typography variant="text-12-bold" className="text-gray-900 w-10 text-right">
                    {formatInteger(loc.ordersCreatedInPeriod, locale)}
                  </Typography>
                </View>
              );
            })}
          </View>
        </StatsSectionCard>
      ) : null}

      {coupons && funnel ? (
        <StatsSectionCard title={t("MerchantStats.sectionCoupons")}>
          <View className="flex-row flex-wrap gap-2 mb-3">
            <View className="flex-1 min-w-1/4 bg-gray-50 rounded-lg p-2 flex-col">
              <View className="min-h-9 justify-end">
                <Typography
                  variant="text-12-semibold"
                  className="text-gray-600 uppercase tracking-wide text-center"
                  numberOfLines={2}
                >
                  {t("MerchantStats.couponsConfiguredShort")}
                </Typography>
              </View>
              <Typography variant="text-16-bold" className="text-gray-900 mt-1 text-center">
                {formatInteger(coupons.totalCouponsConfigured, locale)}
              </Typography>
            </View>
            <View className="flex-1 min-w-1/4 bg-blue-50 rounded-lg p-2 flex-col">
              <View className="min-h-9 justify-end">
                <Typography
                  variant="text-12-semibold"
                  className="text-blue-900 uppercase tracking-wide text-center"
                  numberOfLines={2}
                >
                  {t("MerchantStats.couponsActiveShort")}
                </Typography>
              </View>
              <Typography variant="text-16-bold" className="text-blue-900 mt-1 text-center">
                {formatInteger(coupons.activeCoupons, locale)}
              </Typography>
            </View>
            <View className="flex-1 min-w-1/4 bg-emerald-50 rounded-lg p-2 flex-col">
              <View className="min-h-9 justify-end">
                <Typography
                  variant="text-12-semibold"
                  className="text-emerald-800 uppercase tracking-wide text-center"
                  numberOfLines={2}
                >
                  {t("MerchantStats.kpiClaimToUse")}
                </Typography>
              </View>
              <Typography variant="text-16-bold" className="text-emerald-700 mt-1 text-center">
                {formatPercent(funnel.couponFunnel.claimToUseRate, locale)}
              </Typography>
            </View>
          </View>
          {Object.keys(coupons.byTypeInPeriod).length > 0 ? (
            <View className="gap-3 mt-2">
              <Typography variant="text-14-bold" className="text-gray-800">
                {t("MerchantStats.couponByType")}
              </Typography>
              {Object.entries(coupons.byTypeInPeriod).map(([type, metrics]) => {
                const maxBar = maxPositiveOrOne(metrics.claimed, metrics.used);
                const wClaim = (metrics.claimed / maxBar) * 100;
                const wUsed = (metrics.used / maxBar) * 100;
                return (
                  <View key={type} className="gap-1">
                    <View className="flex-row justify-between gap-2">
                      <Typography variant="text-12-semibold" className="text-gray-800 shrink">
                        {merchantStatsCouponTypeLabel(t, type)}
                      </Typography>
                      <Typography variant="text-12-regular" className="text-gray-700 shrink-0">
                        {t("MerchantStats.couponClaimedUsed", {
                          claimed: formatInteger(metrics.claimed, locale),
                          used: formatInteger(metrics.used, locale),
                        })}
                      </Typography>
                    </View>
                    <View className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <View className="h-full bg-blue-900 rounded-full" style={{ width: `${wClaim}%` }} />
                    </View>
                    <View className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <View className="h-full bg-red-500 rounded-full opacity-90" style={{ width: `${wUsed}%` }} />
                    </View>
                  </View>
                );
              })}
            </View>
          ) : null}
          {topSlice.length > 0 ? (
            <View className="gap-2 mt-3">
              <Typography variant="text-14-bold" className="text-gray-800">
                {t("MerchantStats.couponsTopUsageTitle")}
              </Typography>
              <Typography variant="text-12-regular" className="text-gray-600 leading-snug mb-1.5">
                {t("MerchantStats.couponsUsageShareHint")}
              </Typography>
              {topSlice.map((row, index) => {
                const w = (row.usageCount / maxTopUsage) * 100;
                return (
                  <View key={row.couponId} className="gap-1.5 py-2 border-b border-gray-100">
                    <View className="flex-row justify-between items-start gap-2">
                      <View className="flex-1 pr-2">
                        <Typography variant="text-12-semibold" className="text-gray-800">
                          {row.title}
                        </Typography>
                        <Typography variant="text-12-regular" className="text-gray-600">
                          {row.couponType}
                        </Typography>
                      </View>
                      <View className="items-end gap-1">
                        {index === 0 ? (
                          <View className="px-2 py-0.5 rounded-full bg-blue-900">
                            <Typography variant="text-9-bold" className="text-white">
                              {t("MerchantStats.couponsTopMostUsedChip")}
                            </Typography>
                          </View>
                        ) : null}
                        <Typography variant="text-12-bold" className="text-blue-900">
                          {formatInteger(row.usageCount, locale)}
                        </Typography>
                      </View>
                    </View>
                    <View className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <View className="h-full bg-blue-900 rounded-full" style={{ width: `${w}%` }} />
                    </View>
                  </View>
                );
              })}
            </View>
          ) : null}
        </StatsSectionCard>
      ) : null}
    </View>
  );
};
