import { useGetMerchantStores } from "@/hooks/graphql/queries/useGetMerchantStores";
import { useGetMyMerchants } from "@/hooks/graphql/queries/useGetMyMerchants";
import { useMyOperatorCapabilities } from "@/hooks/graphql/queries/useMyOperatorCapabilities";
import { useAuthState } from "@/hooks/useAuthState";
import { useOnboardingStatus } from "@/hooks/useOnboardingStatus";
import { safeSetItem } from "@/utils/safeAsyncStorage";
import { effectiveScanStoreId } from "@/utils/effectiveScanStoreId";
import React, { createContext, useContext, useEffect, useMemo } from "react";
import type { OperatorAccessContextValue, OperatorAccessStore, OperatorMerchant } from "./types";
import { useOperatorAccessContextModel } from "./useOperatorAccessContextModel";
import { useOperatorSelectionState } from "./useOperatorSelectionState";
import {
  useSyncOperatorMerchantSelection,
  useSyncOperatorStoreSelection,
} from "./useOperatorSelectionSync";
import { SELECTED_SCAN_STORE_STORAGE_KEY } from "./constants";
import { isNonEmptyString, isOperatorScope } from "./utils";

const OperatorAccessContext = createContext<OperatorAccessContextValue | null>(null);

export const OperatorAccessProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const {
    selectedMerchantId,
    setSelectedMerchantId,
    selectedStoreId,
    setSelectedStoreId,
    selectedScanStoreId,
    setSelectedScanStoreId,
    isHydrated,
  } = useOperatorSelectionState();

  const { isLoggedIn, isLoading: authLoading } = useAuthState();
  const shouldSkipQueries = !isLoggedIn;
  const {
    data: capabilitiesData,
    loading: capabilitiesLoading,
    error: capabilitiesError,
  } = useMyOperatorCapabilities({ skip: shouldSkipQueries });
  const capabilities = capabilitiesData?.myOperatorCapabilities;
  const merchantScopes = useMemo(
    () => (capabilities?.merchantScopes ?? []).filter(isOperatorScope),
    [capabilities?.merchantScopes],
  );
  const isAdmin = capabilities?.isAdmin ?? false;
  const isOwner = capabilities?.isOwner ?? false;
  const canLoadMerchantContextQueries = Boolean(
    isLoggedIn &&
      !authLoading &&
      !capabilitiesLoading &&
      (isAdmin || merchantScopes.length > 0),
  );
  const {
    isLoading: onboardingProfileLoading,
    hasCompany,
    hasMerchant,
  } = useOnboardingStatus();
  const skipMerchantStoresUntilMerchantOnboarding =
    onboardingProfileLoading || (hasCompany && !hasMerchant);
  const {
    data: merchantsData,
    loading: merchantsLoading,
    error: merchantsError,
  } = useGetMyMerchants({
    skip: !canLoadMerchantContextQueries,
  });
  const {
    data: storesData,
    loading: storesLoading,
    error: storesError,
  } = useGetMerchantStores({
    skip:
      !canLoadMerchantContextQueries || skipMerchantStoresUntilMerchantOnboarding,
  });

  const merchants = useMemo(
    () =>
      (merchantsData?.myMerchants ?? []).filter(
        (merchant): merchant is OperatorMerchant =>
          isNonEmptyString(merchant.id) && isNonEmptyString(merchant.name),
      ),
    [merchantsData?.myMerchants],
  );
  const stores = useMemo(
    () =>
      (storesData?.myStores ?? []).filter(
        (store): store is OperatorAccessStore =>
          isNonEmptyString(store.id)
          && isNonEmptyString(store.name)
          && isNonEmptyString(store.merchantId),
      ),
    [storesData?.myStores],
  );
  const merchantIdsWithAccess = useMemo(
    () => Array.from(new Set(merchantScopes.map((scope) => scope.merchantId))),
    [merchantScopes],
  );

  useSyncOperatorMerchantSelection({
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
  });

  useEffect(() => {
    if (!isHydrated) return;
    const effective = effectiveScanStoreId(selectedScanStoreId, stores);
    if (effective === selectedScanStoreId) return;
    setSelectedScanStoreId(effective);
    void safeSetItem(SELECTED_SCAN_STORE_STORAGE_KEY, effective ?? "");
  }, [isHydrated, selectedScanStoreId, setSelectedScanStoreId, stores]);

  const { contextValue, availableStores, isStoreScoped } = useOperatorAccessContextModel({
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
  });

  useSyncOperatorStoreSelection({
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
  });

  return (
    <OperatorAccessContext.Provider value={contextValue}>
      {children}
    </OperatorAccessContext.Provider>
  );
};

export const useOperatorAccess = () => {
  const context = useContext(OperatorAccessContext);
  if (!context) {
    throw new Error("useOperatorAccess must be used within OperatorAccessProvider");
  }
  return context;
};
