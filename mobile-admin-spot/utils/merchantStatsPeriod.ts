import type { TrendGranularity } from "@/shared/api-client/src/stats/types";
import type { TFunction } from "i18next";

export type StatsPeriodPresetId = "7d" | "30d" | "90d" | "month" | "custom";

export const buildMerchantStatsPeriodLabels = (t: TFunction): Record<StatsPeriodPresetId, string> => ({
  "7d": t("MerchantStats.period7d"),
  "30d": t("MerchantStats.period30d"),
  "90d": t("MerchantStats.period90d"),
  month: t("MerchantStats.periodMonth"),
  custom: t("MerchantStats.periodCustom"),
});

export const buildMerchantStatsStoresSubtitle = (
  t: TFunction,
  preset: StatsPeriodPresetId,
  storeCount: number,
): string => {
  const labels = buildMerchantStatsPeriodLabels(t);
  return t("MerchantStats.subtitlePresetStores", {
    preset: labels[preset],
    count: storeCount,
  });
};

export const buildMerchantStatsLocationsSubtitle = (
  t: TFunction,
  preset: StatsPeriodPresetId,
  locationCount: number,
): string => {
  const labels = buildMerchantStatsPeriodLabels(t);
  return t("MerchantStats.subtitlePresetLocations", {
    preset: labels[preset],
    count: locationCount,
  });
};

export type StatsCustomPeriodRange = {
  from: string;
  to: string;
};

const PRESET_LOOKBACK_DAYS: Partial<Record<Exclude<StatsPeriodPresetId, "custom">, number>> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
};

export const getStatsPeriodIsoRange = (
  preset: Exclude<StatsPeriodPresetId, "custom">,
): { from: string; to: string } => {
  const to = new Date();
  const from = new Date(to.getTime());
  const days = PRESET_LOOKBACK_DAYS[preset];
  if (days !== undefined) {
    from.setUTCDate(from.getUTCDate() - days);
  } else {
    from.setUTCFullYear(to.getUTCFullYear(), to.getUTCMonth(), 1);
    from.setUTCHours(0, 0, 0, 0);
  }
  return { from: from.toISOString(), to: to.toISOString() };
};

export const resolveMerchantStatsPeriodRange = (
  preset: StatsPeriodPresetId,
  custom: StatsCustomPeriodRange | null,
): { from: string; to: string } => {
  if (preset === "custom") {
    if (custom?.from && custom?.to) {
      return { from: custom.from, to: custom.to };
    }
    return getStatsPeriodIsoRange("30d");
  }
  return getStatsPeriodIsoRange(preset);
};

export const trendsGranularityForPreset = (
  preset: Exclude<StatsPeriodPresetId, "custom">,
): TrendGranularity => {
  if (preset === "7d") {
    return "day";
  }
  return "week";
};

const HUB_PRESET_CHIP_I18N_KEY: Record<
  StatsPeriodPresetId,
  | "MerchantStats.hubPresetChip7d"
  | "MerchantStats.hubPresetChip30d"
  | "MerchantStats.hubPresetChip90d"
  | "MerchantStats.hubPresetChipMonth"
  | "MerchantStats.hubPresetChipCustom"
> = {
  "7d": "MerchantStats.hubPresetChip7d",
  "30d": "MerchantStats.hubPresetChip30d",
  "90d": "MerchantStats.hubPresetChip90d",
  month: "MerchantStats.hubPresetChipMonth",
  custom: "MerchantStats.hubPresetChipCustom",
};

export const merchantStatsPresetHubChipI18nKey = (
  preset: StatsPeriodPresetId,
):
  | "MerchantStats.hubPresetChip7d"
  | "MerchantStats.hubPresetChip30d"
  | "MerchantStats.hubPresetChip90d"
  | "MerchantStats.hubPresetChipMonth"
  | "MerchantStats.hubPresetChipCustom" => HUB_PRESET_CHIP_I18N_KEY[preset];

export const resolveMerchantStatsTrendGranularity = (
  preset: StatsPeriodPresetId,
  custom: StatsCustomPeriodRange | null,
): TrendGranularity => {
  if (preset === "custom" && custom?.from && custom?.to) {
    const ms = new Date(custom.to).getTime() - new Date(custom.from).getTime();
    const days = ms / 86400000;
    if (days <= 14) {
      return "day";
    }
    if (days <= 120) {
      return "week";
    }
    return "month";
  }
  if (preset === "custom") {
    return "week";
  }
  return trendsGranularityForPreset(preset);
};
