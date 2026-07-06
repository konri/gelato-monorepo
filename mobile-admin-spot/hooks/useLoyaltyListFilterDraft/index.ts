import {
  createEmptyLoyaltyListFilters,
  patchLoyaltyListToggleListItem,
  type LoyaltyListAppliedFilters,
  type LoyaltyListFilterToggleArgs,
} from "@/utils/loyaltyListFilterApply";
import { useCallback, useEffect, useState } from "react";

type UseLoyaltyListFilterDraftParams = {
  appliedFilters: LoyaltyListAppliedFilters;
  visible: boolean;
};

export const useLoyaltyListFilterDraft = ({
  appliedFilters,
  visible,
}: UseLoyaltyListFilterDraftParams) => {
  const [draft, setDraft] = useState<LoyaltyListAppliedFilters>(appliedFilters);

  useEffect(() => {
    if (visible) {
      setDraft(appliedFilters);
    }
  }, [visible, appliedFilters]);

  const toggleListField = useCallback((...args: LoyaltyListFilterToggleArgs) => {
    setDraft((previous) => patchLoyaltyListToggleListItem(previous, ...args));
  }, []);

  const resetDraft = useCallback(() => {
    setDraft(createEmptyLoyaltyListFilters());
  }, []);

  const setStoreExclusiveOnly = useCallback((value: boolean) => {
    setDraft((previous) => ({ ...previous, storeExclusiveOnly: value }));
  }, []);

  return { draft, toggleListField, resetDraft, setStoreExclusiveOnly };
};
