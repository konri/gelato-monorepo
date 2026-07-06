import { useMerchantStatsBundle } from "@/hooks/graphql/queries/useMerchantStatsBundle";
import { useMerchantStatsTrendOrders } from "@/hooks/graphql/queries/useMerchantStatsTrendOrders";
import { useMerchantStatsTrendStreakVisits } from "@/hooks/graphql/queries/useMerchantStatsTrendStreakVisits";
import type { MerchantStatsBundleData } from "@/shared/api-client/src/graphql/queries/merchantStats";
import type { StatsCompareMode } from "@/shared/api-client/src/stats/types";
import {
  resolveMerchantStatsPeriodRange,
  resolveMerchantStatsTrendGranularity,
  type StatsCustomPeriodRange,
  type StatsPeriodPresetId,
} from "@/utils/merchantStatsPeriod";
import {
  mergeMerchantStatsBundleWithSplitTrends,
  narrowMerchantStatsSlices,
} from "@/utils/merchantStatsBundleTrendsMerge";
import { getMerchantStatsQueryErrorMessage } from "@/utils/merchantStatsQueryError";
import { normalizeMerchantStatsBundle } from "@/utils/normalizeMerchantStatsBundle";
import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";

export type MerchantStatsStoreFilterInput =
  | { mode: "network" }
  | { mode: "stores"; storeIds: string[] };

type UseMerchantStatsParams = {
  merchantId: string | null;
  storeFilter: MerchantStatsStoreFilterInput;
  loyaltyCardTemplateId: string | null;
  streakProgramId: string | null;
  compareMode: StatsCompareMode;
  preset: StatsPeriodPresetId;
  customRange: StatsCustomPeriodRange | null;
  enabled: boolean;
};

export type UseMerchantStatsResult = {
  bundle: MerchantStatsBundleData | null;
  loading: boolean;
  queryFailed: boolean;
  errorMessage: string | null;
  refresh: () => Promise<unknown>;
};

const buildStoreVariables = (
  storeFilter: MerchantStatsStoreFilterInput,
): { storeId?: string; storeIds?: string[] } => {
  if (storeFilter.mode === "network") {
    return {};
  }
  const ids = storeFilter.storeIds.filter((id) => id.length > 0);
  if (ids.length === 0) {
    return {};
  }
  if (ids.length === 1) {
    return { storeId: ids[0] };
  }
  return { storeIds: ids };
};

export const useMerchantStats = ({
  merchantId,
  storeFilter,
  loyaltyCardTemplateId,
  streakProgramId,
  compareMode,
  preset,
  customRange,
  enabled,
}: UseMerchantStatsParams): UseMerchantStatsResult => {
  const { t } = useTranslation();
  const { from, to } = useMemo(
    () => resolveMerchantStatsPeriodRange(preset, customRange),
    [preset, customRange],
  );
  const granularity = useMemo(
    () => resolveMerchantStatsTrendGranularity(preset, customRange),
    [preset, customRange],
  );

  const storeVars = useMemo(() => buildStoreVariables(storeFilter), [storeFilter]);

  const commonQueryOpts = {
    skip: !enabled,
    from,
    to,
    compareMode,
    ...(merchantId && merchantId.length > 0 ? { merchantId } : {}),
    ...storeVars,
    ...(loyaltyCardTemplateId && loyaltyCardTemplateId.length > 0
      ? { loyaltyCardTemplateId }
      : {}),
    ...(streakProgramId && streakProgramId.length > 0 ? { streakProgramId } : {}),
  };

  const {
    data: bundleData,
    loading: bundleLoading,
    error: bundleError,
    refetch: refetchBundle,
  } = useMerchantStatsBundle(commonQueryOpts);

  const {
    data: ordersTrendData,
    loading: ordersTrendLoading,
    error: ordersTrendError,
    refetch: refetchOrdersTrend,
  } = useMerchantStatsTrendOrders({
    ...commonQueryOpts,
    granularity,
  });

  const {
    data: streakTrendData,
    loading: streakTrendLoading,
    error: streakTrendError,
    refetch: refetchStreakTrend,
  } = useMerchantStatsTrendStreakVisits({
    ...commonQueryOpts,
    granularity,
  });

  const loading = bundleLoading || ordersTrendLoading || streakTrendLoading;
  const error = bundleError ?? ordersTrendError ?? streakTrendError;

  const bundle = useMemo((): MerchantStatsBundleData | null => {
    const slices = narrowMerchantStatsSlices(
      bundleData?.merchantStatsBundle,
      ordersTrendData?.merchantStatsTrendOrders,
      streakTrendData?.merchantStatsTrendStreakVisits,
    );
    if (slices == null) {
      return null;
    }
    const merged = mergeMerchantStatsBundleWithSplitTrends(
      slices.bundle,
      slices.orders,
      slices.streak,
    );
    if (merged == null) {
      return null;
    }
    return normalizeMerchantStatsBundle(merged);
  }, [
    bundleData?.merchantStatsBundle,
    ordersTrendData?.merchantStatsTrendOrders,
    streakTrendData?.merchantStatsTrendStreakVisits,
  ]);

  const errorMessage = useMemo(() => {
    if (!error) {
      return null;
    }
    return getMerchantStatsQueryErrorMessage(error, t);
  }, [error, t]);

  const refresh = useCallback(async () => {
    await Promise.all([refetchBundle(), refetchOrdersTrend(), refetchStreakTrend()]);
  }, [refetchBundle, refetchOrdersTrend, refetchStreakTrend]);

  return {
    bundle,
    loading,
    queryFailed: Boolean(error),
    errorMessage,
    refresh,
  };
};

export const useMerchantStatsLocale = (): string => {
  const { i18n } = useTranslation();
  return i18n.language?.startsWith("pl") ? "pl-PL" : "en-US";
};
