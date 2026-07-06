import { Typography } from "@/components/atoms/Typography";
import { StatsCustomPeriodPickers } from "@/components/molecules/StatsCustomPeriodPickers";
import { StatsNetworkStoreScopeChips, StatsPeriodChips } from "@/components/molecules/StatsSessionChips";
import { MERCHANT_STATS_FILTER_SURFACE_CLASS } from "@/constants/merchantStatsUi";
import { useMerchantStatsSession } from "@/contexts/MerchantStatsSessionContext";
import { useMerchantStatsLocale } from "@/hooks/useMerchantStats";
import { buildMerchantStatsPeriodLabels } from "@/utils/merchantStatsPeriod";
import { formatShortDate } from "@/utils/merchantStatsFormat";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, View } from "react-native";
import DateTimePickerModal from "react-native-modal-datetime-picker";

const MerchantStatsGlobalFiltersForm = () => {
  const { t } = useTranslation();
  const locale = useMerchantStatsLocale();
  const {
    preset,
    setPreset,
    storeScope,
    setStoreScope,
    showStoreScopeToggle,
    customFromIso,
    setCustomFromIso,
    customToIso,
    setCustomToIso,
    fromPickerOpen,
    setFromPickerOpen,
    toPickerOpen,
    setToPickerOpen,
  } = useMerchantStatsSession();

  const periodLabels = useMemo(() => buildMerchantStatsPeriodLabels(t), [t]);

  const storeScopeLabels = useMemo(
    () =>
      ({
        network: t("MerchantStats.storeScopeNetwork"),
        context_store: t("MerchantStats.storeScopeContext"),
      }) satisfies Record<"network" | "context_store", string>,
    [t],
  );

  return (
    <View className="gap-5">
      <View className="gap-2.5">
        <Typography variant="text-12-semibold" className="text-gray-600 uppercase tracking-wide">
          {t("MerchantStats.periodLabel")}
        </Typography>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          nestedScrollEnabled
          contentContainerClassName="flex-row gap-2 pr-1"
        >
          <StatsPeriodChips
            value={preset}
            onChange={setPreset}
            labels={periodLabels}
            layout="row"
          />
        </ScrollView>
      </View>

      {preset === "custom" ? (
        <View className="gap-2">
          <Typography variant="text-12-semibold" className="text-gray-600 uppercase tracking-wide">
            {t("MerchantStats.periodCustom")}
          </Typography>
          <StatsCustomPeriodPickers
            fromTitle={t("MerchantStats.customFrom")}
            toTitle={t("MerchantStats.customTo")}
            fromValue={formatShortDate(customFromIso, locale)}
            toValue={formatShortDate(customToIso, locale)}
            onPressFrom={() => setFromPickerOpen(true)}
            onPressTo={() => setToPickerOpen(true)}
          />
          <DateTimePickerModal
            isVisible={fromPickerOpen}
            mode="date"
            onConfirm={(d) => {
              setCustomFromIso(d.toISOString());
              setFromPickerOpen(false);
            }}
            onCancel={() => setFromPickerOpen(false)}
          />
          <DateTimePickerModal
            isVisible={toPickerOpen}
            mode="date"
            onConfirm={(d) => {
              setCustomToIso(d.toISOString());
              setToPickerOpen(false);
            }}
            onCancel={() => setToPickerOpen(false)}
          />
        </View>
      ) : null}

      {showStoreScopeToggle ? (
        <View className="gap-2">
          <Typography variant="text-12-semibold" className="text-gray-600 uppercase tracking-wide">
            {t("MerchantStats.storeFilterLabel")}
          </Typography>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            nestedScrollEnabled
            contentContainerClassName="flex-row gap-2 pr-1"
          >
            <StatsNetworkStoreScopeChips
              value={storeScope}
              onChange={setStoreScope}
              labels={storeScopeLabels}
              layout="row"
            />
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
};

export const MerchantStatsGlobalFiltersFields = () => {
  const { t } = useTranslation();
  return (
    <View className="gap-5">
      <Typography variant="text-12-regular" className="text-gray-600">
        {t("MerchantStats.globalFiltersCaption")}
      </Typography>
      <MerchantStatsGlobalFiltersForm />
    </View>
  );
};

export const MerchantStatsGlobalFiltersBar = () => {
  const { canReadMerchant, accessLoading } = useMerchantStatsSession();
  const { t } = useTranslation();
  if (!canReadMerchant || accessLoading) {
    return null;
  }
  return (
    <View className={MERCHANT_STATS_FILTER_SURFACE_CLASS}>
      <Typography variant="text-14-semibold" className="text-gray-800">
        {t("MerchantStats.globalFiltersCaption")}
      </Typography>
      <MerchantStatsGlobalFiltersForm />
    </View>
  );
};
