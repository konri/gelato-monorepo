import { StatsIdPickerModal } from "@/components/molecules/StatsIdPickerModal";
import { MerchantStatsFiltersSheet } from "@/components/organisms/MerchantStatsFiltersSheet";
import { useMerchantStatsSession } from "@/contexts/MerchantStatsSessionContext";
import React from "react";
import { useTranslation } from "react-i18next";

export const MerchantStatsSessionOverlays = () => {
  const { t } = useTranslation();
  const {
    canReadMerchant,
    accessLoading,
    loyaltyCardTemplateId,
    setLoyaltyCardTemplateId,
    streakProgramId,
    setStreakProgramId,
    templateModalOpen,
    setTemplateModalOpen,
    streakModalOpen,
    setStreakModalOpen,
    templatePickerItems,
    streakPickerItems,
  } = useMerchantStatsSession();

  if (!canReadMerchant || accessLoading) {
    return null;
  }

  return (
    <>
      <MerchantStatsFiltersSheet />
      <StatsIdPickerModal
        visible={templateModalOpen}
        title={t("MerchantStats.filterStampTemplate")}
        clearLabel={t("MerchantStats.filterClear")}
        items={templatePickerItems}
        selectedId={loyaltyCardTemplateId}
        onSelect={setLoyaltyCardTemplateId}
        onClose={() => setTemplateModalOpen(false)}
      />
      <StatsIdPickerModal
        visible={streakModalOpen}
        title={t("MerchantStats.filterStreakProgram")}
        clearLabel={t("MerchantStats.filterClear")}
        items={streakPickerItems}
        selectedId={streakProgramId}
        onSelect={setStreakProgramId}
        onClose={() => setStreakModalOpen(false)}
      />
    </>
  );
};
