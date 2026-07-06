import type { OperatorAccessStore } from "@/hooks/useOperatorAccess/types";
import type { LoyaltyListAppliedFilters } from "@/utils/loyaltyListFilterApply";

export type LoyaltyListFilterModalBaseProps = {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: LoyaltyListAppliedFilters) => void;
  appliedFilters: LoyaltyListAppliedFilters;
  availableStores: OperatorAccessStore[];
  hideStoreSection: boolean;
  storeExclusiveFilterVisible?: boolean;
};
