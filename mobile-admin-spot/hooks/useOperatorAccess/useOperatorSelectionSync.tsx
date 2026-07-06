import { safeSetItem } from "@/utils/safeAsyncStorage";
import { useEffect } from "react";
import {
  SELECTED_MERCHANT_STORAGE_KEY,
  SELECTED_SCAN_STORE_STORAGE_KEY,
  SELECTED_STORE_STORAGE_KEY,
} from "./constants";
import type { OperatorAccessStore, OperatorMerchant } from "./types";

type UseSyncOperatorMerchantSelectionParams = {
  isHydrated: boolean;
  authLoading: boolean;
  capabilitiesLoading: boolean;
  canLoadMerchantContextQueries: boolean;
  merchantsLoading: boolean;
  storesLoading: boolean;
  isAdmin: boolean;
  merchants: OperatorMerchant[];
  merchantIdsWithAccess: string[];
  selectedMerchantId: string | null;
  selectedStoreId: string | null;
  selectedScanStoreId: string | null;
  setSelectedMerchantId: (id: string | null) => void;
  setSelectedStoreId: (id: string | null) => void;
  setSelectedScanStoreId: (id: string | null) => void;
};

export const useSyncOperatorMerchantSelection = ({
  isHydrated,
  authLoading,
  capabilitiesLoading,
  canLoadMerchantContextQueries,
  merchantsLoading,
  storesLoading,
  isAdmin,
  merchants,
  merchantIdsWithAccess,
  selectedMerchantId,
  selectedStoreId,
  selectedScanStoreId,
  setSelectedMerchantId,
  setSelectedStoreId,
  setSelectedScanStoreId,
}: UseSyncOperatorMerchantSelectionParams) => {
  useEffect(() => {
    if (!isHydrated) {
      return;
    }
    if (authLoading || capabilitiesLoading) {
      return;
    }
    if (canLoadMerchantContextQueries && (merchantsLoading || storesLoading)) {
      return;
    }
    const merchantIds = isAdmin
      ? merchants.map((merchant) => merchant.id)
      : merchantIdsWithAccess;

    if (merchantIds.length === 0) {
      if (
        selectedMerchantId !== null ||
        selectedStoreId !== null ||
        selectedScanStoreId !== null
      ) {
        setSelectedMerchantId(null);
        setSelectedStoreId(null);
        setSelectedScanStoreId(null);
        void safeSetItem(SELECTED_MERCHANT_STORAGE_KEY, "");
        void safeSetItem(SELECTED_STORE_STORAGE_KEY, "");
        void safeSetItem(SELECTED_SCAN_STORE_STORAGE_KEY, "");
      }
      return;
    }

    const nextMerchantId = merchantIds.includes(selectedMerchantId ?? "")
      ? selectedMerchantId
      : merchantIds[0];

    if (!nextMerchantId) {
      return;
    }

    if (nextMerchantId !== selectedMerchantId) {
      setSelectedMerchantId(nextMerchantId);
      setSelectedScanStoreId(null);
      void Promise.all([
        safeSetItem(SELECTED_MERCHANT_STORAGE_KEY, nextMerchantId),
        safeSetItem(SELECTED_SCAN_STORE_STORAGE_KEY, ""),
      ]);
    }
  }, [
    authLoading,
    canLoadMerchantContextQueries,
    capabilitiesLoading,
    isAdmin,
    isHydrated,
    merchantIdsWithAccess,
    merchants,
    merchantsLoading,
    selectedMerchantId,
    selectedScanStoreId,
    selectedStoreId,
    setSelectedMerchantId,
    setSelectedScanStoreId,
    setSelectedStoreId,
    storesLoading,
  ]);
};

type UseSyncOperatorStoreSelectionParams = {
  canLoadMerchantContextQueries: boolean;
  merchantsLoading: boolean;
  storesLoading: boolean;
  selectedMerchantId: string | null;
  selectedStoreId: string | null;
  setSelectedStoreId: (id: string | null) => void;
  setSelectedScanStoreId: (id: string | null) => void;
  availableStores: OperatorAccessStore[];
  isStoreScoped: boolean;
  isAdmin: boolean;
};

export const useSyncOperatorStoreSelection = ({
  canLoadMerchantContextQueries,
  merchantsLoading,
  storesLoading,
  selectedMerchantId,
  selectedStoreId,
  setSelectedStoreId,
  setSelectedScanStoreId,
  availableStores,
  isStoreScoped,
  isAdmin,
}: UseSyncOperatorStoreSelectionParams) => {
  useEffect(() => {
    if (!selectedMerchantId) {
      return;
    }
    if (canLoadMerchantContextQueries && (merchantsLoading || storesLoading)) {
      return;
    }
    const storeIds = availableStores.map((store) => store.id);
    const mustPickStore = isStoreScoped && !isAdmin && availableStores.length > 0;
    const nextStoreId = storeIds.includes(selectedStoreId ?? "")
      ? selectedStoreId
      : mustPickStore
        ? availableStores[0]?.id ?? null
        : null;

    if (nextStoreId !== selectedStoreId) {
      setSelectedStoreId(nextStoreId);
      void safeSetItem(SELECTED_STORE_STORAGE_KEY, nextStoreId ?? "");
      if (nextStoreId != null) {
        setSelectedScanStoreId(nextStoreId);
        void safeSetItem(SELECTED_SCAN_STORE_STORAGE_KEY, nextStoreId);
      }
    }
  }, [
    availableStores,
    canLoadMerchantContextQueries,
    isAdmin,
    isStoreScoped,
    merchantsLoading,
    selectedMerchantId,
    selectedStoreId,
    setSelectedScanStoreId,
    setSelectedStoreId,
    storesLoading,
  ]);
};
