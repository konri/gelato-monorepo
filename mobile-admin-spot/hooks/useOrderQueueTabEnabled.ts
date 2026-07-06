import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { useOperatorAccess } from "@/hooks/useOperatorAccess";

export const useOrderQueueTabEnabled = () => {
  const { hasAnyMerchantAccess, availableStores, isLoading } = useOperatorAccess();
  const { canRead: canReadStore } = useFeatureAccess("store");

  const baseEligible = hasAnyMerchantAccess && canReadStore;

  if (!baseEligible || isLoading) {
    return false;
  }

  return availableStores.some((store) => store.orderQueueSettings != null);
};
