import { safeGetItem } from "@/utils/safeAsyncStorage";
import { useEffect, useState } from "react";
import {
  SELECTED_MERCHANT_STORAGE_KEY,
  SELECTED_SCAN_STORE_STORAGE_KEY,
  SELECTED_STORE_STORAGE_KEY,
} from "./constants";

export const useOperatorSelectionState = () => {
  const [selectedMerchantId, setSelectedMerchantId] = useState<string | null>(null);
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  const [selectedScanStoreId, setSelectedScanStoreId] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const hydrateContext = async () => {
      const [merchantId, storeId, scanStoreId] = await Promise.all([
        safeGetItem(SELECTED_MERCHANT_STORAGE_KEY),
        safeGetItem(SELECTED_STORE_STORAGE_KEY),
        safeGetItem(SELECTED_SCAN_STORE_STORAGE_KEY),
      ]);
      setSelectedMerchantId(merchantId && merchantId.length > 0 ? merchantId : null);
      setSelectedStoreId(storeId && storeId.length > 0 ? storeId : null);
      setSelectedScanStoreId(scanStoreId && scanStoreId.length > 0 ? scanStoreId : null);
      setIsHydrated(true);
    };

    void hydrateContext();
  }, []);

  return {
    selectedMerchantId,
    setSelectedMerchantId,
    selectedStoreId,
    setSelectedStoreId,
    selectedScanStoreId,
    setSelectedScanStoreId,
    isHydrated,
  };
};
