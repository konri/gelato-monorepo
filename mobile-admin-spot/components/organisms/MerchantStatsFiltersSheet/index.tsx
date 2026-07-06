import { Typography } from "@/components/atoms/Typography";
import { StatsCompareModeChips } from "@/components/molecules/StatsSessionChips";
import { StatsFilterPickerRow } from "@/components/molecules/StatsFilterPickerRow";
import { StatsMerchantStatsFiltersCard } from "@/components/molecules/StatsMerchantStatsFiltersCard";
import { MerchantStatsGlobalFiltersFields } from "@/components/organisms/MerchantStatsGlobalFiltersBar";
import { CenteredModalCardLayout } from "@/components/organisms/CenteredModalCardLayout";
import { useMerchantStatsSession } from "@/contexts/MerchantStatsSessionContext";
import { buildMerchantStatsCompareModeLabels } from "@/utils/merchantStatsCompareLabels";
import React, { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, View } from "react-native";

export const MerchantStatsFiltersSheet = () => {
  const { t } = useTranslation();
  const {
    filtersSheetOpen,
    setFiltersSheetOpen,
    compareMode,
    setCompareMode,
    loyaltyCardTemplateId,
    streakProgramId,
    selectedTemplateTitle,
    selectedStreakTitle,
    setTemplateModalOpen,
    setStreakModalOpen,
    setPreset,
    setStoreScope,
    setLoyaltyCardTemplateId,
    setStreakProgramId,
    setCustomFromIso,
    setCustomToIso,
  } = useMerchantStatsSession();

  const compareLabels = useMemo(() => buildMerchantStatsCompareModeLabels(t), [t]);

  const onClose = () => setFiltersSheetOpen(false);

  const handleApply = useCallback(() => {
    setFiltersSheetOpen(false);
  }, [setFiltersSheetOpen]);

  const handleReset = useCallback(() => {
    const end = new Date();
    const start = new Date(end.getTime());
    start.setUTCDate(start.getUTCDate() - 30);
    setCustomFromIso(start.toISOString());
    setCustomToIso(end.toISOString());
    setPreset("30d");
    setCompareMode("previous_period");
    setStoreScope("context_store");
    setLoyaltyCardTemplateId(null);
    setStreakProgramId(null);
  }, [
    setCompareMode,
    setCustomFromIso,
    setCustomToIso,
    setLoyaltyCardTemplateId,
    setPreset,
    setStreakProgramId,
    setStoreScope,
  ]);

  return (
    <CenteredModalCardLayout
      visible={filtersSheetOpen}
      onClose={onClose}
      onApply={handleApply}
      onReset={handleReset}
      title={t("MerchantStats.filterModalTitle")}
    >
      <MerchantStatsGlobalFiltersFields />
      <StatsMerchantStatsFiltersCard
        title={t("MerchantStats.toolbarTitle")}
        subtitle={t("MerchantStats.toolbarSubtitle")}
      >
        <View className="gap-2.5">
          <Typography variant="text-12-semibold" className="text-gray-600 uppercase tracking-wide">
            {t("MerchantStats.compareLabel")}
          </Typography>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            nestedScrollEnabled
            keyboardShouldPersistTaps="handled"
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

        <View className="gap-3.5">
          <Typography variant="text-12-semibold" className="text-gray-600 uppercase tracking-wide">
            {t("MerchantStats.optionalFiltersTitle")}
          </Typography>
          <StatsFilterPickerRow
            caption={t("MerchantStats.filterStampTemplate")}
            valueLabel={
              loyaltyCardTemplateId
                ? (selectedTemplateTitle ?? loyaltyCardTemplateId)
                : t("MerchantStats.filterAllTemplates")
            }
            onPress={() => setTemplateModalOpen(true)}
          />
          <StatsFilterPickerRow
            caption={t("MerchantStats.filterStreakProgram")}
            valueLabel={
              streakProgramId
                ? (selectedStreakTitle ?? streakProgramId)
                : t("MerchantStats.filterAllStreaks")
            }
            onPress={() => setStreakModalOpen(true)}
          />
        </View>
      </StatsMerchantStatsFiltersCard>
    </CenteredModalCardLayout>
  );
};
