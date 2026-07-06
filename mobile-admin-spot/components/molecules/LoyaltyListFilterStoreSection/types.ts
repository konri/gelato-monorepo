import type { OperatorAccessStore } from "@/hooks/useOperatorAccess/types";

export type LoyaltyListFilterStoreSectionProps = {
  availableStores: OperatorAccessStore[];
  hideSection: boolean;
  selectedIds: readonly string[];
  onToggle: (id: string) => void;
};
