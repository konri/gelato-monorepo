import { ALL_OPERATOR_PERMISSIONS } from "@/constants/operatorPermissions";
import type {
  MerchantOperatorScope,
  OperatorPermission,
} from "@/shared/api-client/src/graphql/types/operatorAccess";
import { safeSetItem } from "@/utils/safeAsyncStorage";
import { useCallback, useMemo } from "react";
import {
  SELECTED_MERCHANT_STORAGE_KEY,
  SELECTED_SCAN_STORE_STORAGE_KEY,
  SELECTED_STORE_STORAGE_KEY,
} from "./constants";
import type {
  OperatorAccessContextValue,
  OperatorAccessStore,
  OperatorMerchant,
} from "./types";
import {
  resolveOperatorCapabilityFlags,
  resolveScopeAndAvailableStores,
} from "./utils";

export type OperatorAccessContextModelInput = {
  merchantScopes: MerchantOperatorScope[];
  selectedMerchantId: string | null;
  selectedStoreId: string | null;
  selectedScanStoreId: string | null;
  setSelectedMerchantId: (id: string | null) => void;
  setSelectedStoreId: (id: string | null) => void;
  setSelectedScanStoreId: (id: string | null) => void;
  stores: OperatorAccessStore[];
  merchants: OperatorMerchant[];
  merchantIdsWithAccess: string[];
  isOwner: boolean;
  isAdmin: boolean;
  isHydrated: boolean;
  authLoading: boolean;
  capabilitiesLoading: boolean;
  canLoadMerchantContextQueries: boolean;
  merchantsLoading: boolean;
  storesLoading: boolean;
  capabilitiesError: Error | undefined | null;
  merchantsError: Error | undefined | null;
  storesError: Error | undefined | null;
};

export const useOperatorAccessContextModel = (input: OperatorAccessContextModelInput) => {
  const {
    merchantScopes,
    selectedMerchantId,
    selectedStoreId,
    selectedScanStoreId,
    setSelectedMerchantId,
    setSelectedStoreId,
    setSelectedScanStoreId,
    stores,
    merchants,
    merchantIdsWithAccess,
    isOwner,
    isAdmin,
    isHydrated,
    authLoading,
    capabilitiesLoading,
    canLoadMerchantContextQueries,
    merchantsLoading,
    storesLoading,
    capabilitiesError,
    merchantsError,
    storesError,
  } = input;

  const { currentScope, availableStores } = useMemo(
    () => resolveScopeAndAvailableStores(merchantScopes, selectedMerchantId, stores),
    [merchantScopes, selectedMerchantId, stores],
  );

  const permissions = useMemo<OperatorPermission[]>(() => {
    if (isAdmin) {
      return ALL_OPERATOR_PERMISSIONS;
    }
    if (!currentScope) {
      return [];
    }
    return currentScope.permissions;
  }, [currentScope, isAdmin]);

  const setMerchantContext = useCallback(
    async (merchantId: string) => {
      setSelectedMerchantId(merchantId);
      setSelectedStoreId(null);
      setSelectedScanStoreId(null);
      await Promise.all([
        safeSetItem(SELECTED_MERCHANT_STORAGE_KEY, merchantId),
        safeSetItem(SELECTED_STORE_STORAGE_KEY, ""),
        safeSetItem(SELECTED_SCAN_STORE_STORAGE_KEY, ""),
      ]);
    },
    [setSelectedMerchantId, setSelectedScanStoreId, setSelectedStoreId],
  );

  const setStoreContext = useCallback(
    async (storeId: string | null) => {
      setSelectedStoreId(storeId);
      await safeSetItem(SELECTED_STORE_STORAGE_KEY, storeId ?? "");
      if (storeId != null) {
        setSelectedScanStoreId(storeId);
        await safeSetItem(SELECTED_SCAN_STORE_STORAGE_KEY, storeId);
      }
    },
    [setSelectedScanStoreId, setSelectedStoreId],
  );

  const setScanStoreContext = useCallback(
    async (storeId: string | null) => {
      setSelectedScanStoreId(storeId);
      await safeSetItem(SELECTED_SCAN_STORE_STORAGE_KEY, storeId ?? "");
    },
    [setSelectedScanStoreId],
  );

  const hasPermission = useCallback(
    (permission: OperatorPermission) => {
      if (isAdmin) {
        return true;
      }
      if (!currentScope) {
        return false;
      }
      return currentScope.permissions.includes(permission);
    },
    [currentScope, isAdmin],
  );

  const operatorCapabilityFlags = useMemo(
    () => resolveOperatorCapabilityFlags(currentScope),
    [currentScope],
  );

  const canSelectStore = availableStores.length > 1;
  const isStoreScoped = currentScope?.scopeMode === "STORE_SCOPED";
  const canSelectMerchant = !isStoreScoped && merchants.length > 1;
  const hasAnyMerchantAccess =
    isAdmin || merchants.length > 0 || merchantIdsWithAccess.length > 0;
  const isLoading =
    !isHydrated ||
    authLoading ||
    capabilitiesLoading ||
    (canLoadMerchantContextQueries && (merchantsLoading || storesLoading));
  const error = capabilitiesError ?? merchantsError ?? storesError ?? null;

  const contextValue = useMemo<OperatorAccessContextValue>(
    () => ({
      merchants,
      stores,
      selectedMerchantId,
      selectedStoreId,
      selectedScanStoreId,
      availableStores,
      canSelectStore,
      canSelectMerchant,
      isStoreScoped,
      ...operatorCapabilityFlags,
      permissions,
      hasAnyMerchantAccess,
      isOwner,
      isAdmin,
      isLoading,
      error,
      setMerchantContext,
      setStoreContext,
      setScanStoreContext,
      hasPermission,
    }),
    [
      merchants,
      stores,
      selectedMerchantId,
      selectedStoreId,
      selectedScanStoreId,
      availableStores,
      canSelectStore,
      canSelectMerchant,
      isStoreScoped,
      operatorCapabilityFlags,
      permissions,
      hasAnyMerchantAccess,
      isOwner,
      isAdmin,
      isLoading,
      error,
      setMerchantContext,
      setStoreContext,
      setScanStoreContext,
      hasPermission,
    ],
  );

  return { contextValue, availableStores, isStoreScoped };
};
