import { LoyaltyFilterPillSection } from "@/components/molecules/LoyaltyFilterPillSection";
import { LoyaltyListFilterStoreExclusiveSection } from "@/components/molecules/LoyaltyListFilterStoreExclusiveSection";
import { LoyaltyListFilterStoreSection } from "@/components/molecules/LoyaltyListFilterStoreSection";
import { CenteredModalCardLayout } from "@/components/organisms/CenteredModalCardLayout";
import { useLoyaltyListFilterDraft } from "@/hooks/useLoyaltyListFilterDraft";
import { getLoyaltyCouponTypeFilterOptions } from "@/utils/loyaltyListFilterOptions";
import React, { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { CouponsLoyaltyListFilterModalProps } from "./types";

export const CouponsLoyaltyListFilterModal = ({
  visible,
  onClose,
  onApply,
  appliedFilters,
  availableStores,
  hideStoreSection,
  storeExclusiveFilterVisible,
}: CouponsLoyaltyListFilterModalProps) => {
  const { t } = useTranslation();
  const { draft, toggleListField, resetDraft, setStoreExclusiveOnly } = useLoyaltyListFilterDraft({
    appliedFilters,
    visible,
  });

  const couponTypeOptions = useMemo(() => getLoyaltyCouponTypeFilterOptions(t), [t]);

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
      {storeExclusiveFilterVisible ? (
        <LoyaltyListFilterStoreExclusiveSection
          value={draft.storeExclusiveOnly}
          onChange={setStoreExclusiveOnly}
          title={t("LoyaltyListFilter.storeExclusiveSectionTitle")}
          hint={t("LoyaltyListFilter.storeExclusiveSectionHint")}
        />
      ) : null}
      <LoyaltyFilterPillSection
        title={t("LoyaltyListFilter.couponTypesSection")}
        hint={t("LoyaltyListFilter.couponTypesHint")}
        options={couponTypeOptions}
        selectedIds={draft.couponTypes}
        onToggle={(id) => toggleListField("couponTypes", id)}
      />
    </CenteredModalCardLayout>
  );
};
