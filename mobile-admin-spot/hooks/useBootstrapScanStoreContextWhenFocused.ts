import { useOperatorAccess } from "@/hooks/useOperatorAccess";
import { effectiveScanStoreId } from "@/utils/effectiveScanStoreId";
import { useIsFocused } from "@react-navigation/native";
import { useEffect } from "react";

type UseBootstrapScanStoreContextWhenFocusedOptions = {
  enabled: boolean;
};

export const useBootstrapScanStoreContextWhenFocused = (
  options: UseBootstrapScanStoreContextWhenFocusedOptions,
) => {
  const { enabled } = options;
  const isFocused = useIsFocused();
  const {
    stores,
    selectedScanStoreId,
    selectedMerchantId,
    selectedStoreId,
    setScanStoreContext,
  } = useOperatorAccess();

  useEffect(() => {
    if (!enabled || !isFocused || stores.length < 1) {
      return;
    }
    const scanTargetStoreId = effectiveScanStoreId(selectedScanStoreId, stores);
    if (scanTargetStoreId != null) {
      return;
    }
    const fromWork =
      selectedStoreId != null && stores.some((s) => s.id === selectedStoreId)
        ? selectedStoreId
        : null;
    const forMerchant =
      selectedMerchantId != null
        ? stores.find((s) => s.merchantId === selectedMerchantId)?.id
        : undefined;
    const pick = fromWork ?? forMerchant ?? stores[0].id;
    void setScanStoreContext(pick);
  }, [
    enabled,
    isFocused,
    selectedMerchantId,
    selectedScanStoreId,
    selectedStoreId,
    setScanStoreContext,
    stores,
  ]);
};
