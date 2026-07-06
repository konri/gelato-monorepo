import { LoyaltyFilterPillSection } from "@/components/molecules/LoyaltyFilterPillSection";
import { LoyaltyListFilterStoreSection } from "@/components/molecules/LoyaltyListFilterStoreSection";
import { CenteredModalCardLayout } from "@/components/organisms/CenteredModalCardLayout";
import { useLoyaltyListFilterDraft } from "@/hooks/useLoyaltyListFilterDraft";
import { getLoyaltyStreakPolicyFilterOptions } from "@/utils/loyaltyListFilterOptions";
import React, { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { StreaksLoyaltyListFilterModalProps } from "./types";

export const StreaksLoyaltyListFilterModal = ({
  visible,
  onClose,
  onApply,
  appliedFilters,
  availableStores,
  hideStoreSection,
}: StreaksLoyaltyListFilterModalProps) => {
  const { t } = useTranslation();
  const { draft, toggleListField, resetDraft } = useLoyaltyListFilterDraft({
    appliedFilters,
    visible,
  });

  const streakPolicyOptions = useMemo(() => getLoyaltyStreakPolicyFilterOptions(t), [t]);

  const handleApply = useCallback(() => {
    onApply(draft);
    onClose();
  }, [draft, onApply, onClose]);

  return (
    <CenteredModalCardLayout
      visible={visible}
      onClose={onClose}
      onApply={handleApply}
      onReset={resetDraft}
    >
      <LoyaltyListFilterStoreSection
        availableStores={availableStores}
        hideSection={hideStoreSection}
        selectedIds={draft.storeIds}
        onToggle={(id) => toggleListField("storeIds", id)}
      />
      <LoyaltyFilterPillSection
        title={t("Streak.streakingPolicy")}
        hint={t("LoyaltyListFilter.streakPoliciesHint")}
        options={streakPolicyOptions}
        selectedIds={draft.streakingPolicies}
        onToggle={(id) => toggleListField("streakingPolicies", id)}
      />
    </CenteredModalCardLayout>
  );
};
