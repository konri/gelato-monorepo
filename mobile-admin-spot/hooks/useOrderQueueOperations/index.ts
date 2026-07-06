import { useBootstrapScanStoreContextWhenFocused } from "@/hooks/useBootstrapScanStoreContextWhenFocused";
import { useCancelOrderVendor } from "@/hooks/graphql/mutations/useCancelOrderVendor";
import { useMarkOrderDelayed } from "@/hooks/graphql/mutations/useMarkOrderDelayed";
import { useMarkOrderPickedUp } from "@/hooks/graphql/mutations/useMarkOrderPickedUp";
import { useMarkOrderReady } from "@/hooks/graphql/mutations/useMarkOrderReady";
import { useMarkOrderResumePreparing } from "@/hooks/graphql/mutations/useMarkOrderResumePreparing";
import { useRevertOrderPickUp } from "@/hooks/graphql/mutations/useRevertOrderPickUp";
import { useRevertOrderReady } from "@/hooks/graphql/mutations/useRevertOrderReady";
import { useActiveOrders } from "@/hooks/graphql/queries/useActiveOrders";
import { useRecentClosedOrders } from "@/hooks/graphql/queries/useRecentClosedOrders";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { useOperatorAccess } from "@/hooks/useOperatorAccess";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import type { VendorOrderGraphql } from "@/shared/api-client/src/graphql/queries/activeOrders";
import { effectiveScanStoreId } from "@/utils/effectiveScanStoreId";
import { alertOrderQueueMutationConfirm } from "@/utils/orderQueueMutationConfirmAlert";
import { resolveOrderQueueOperationErrorMessage } from "@/utils/orderQueueOperationErrorMessage";
import { NetworkStatus } from "@apollo/client";
import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert } from "react-native";
import type {
  OrderQueueKanbanColumn,
  OrderQueueOperations,
} from "./types";

export type {
  OrderQueueKanbanColumn,
  OrderQueueKanbanColumnKey,
  OrderQueueOperations,
} from "./types";

export const useOrderQueueOperations = (): OrderQueueOperations => {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ storeId?: string }>();
  const storeIdFromRoute =
    typeof params.storeId === "string" ? params.storeId : undefined;

  const {
    hasAnyMerchantAccess,
    stores,
    selectedScanStoreId,
    setScanStoreContext,
  } = useOperatorAccess();
  const { canRead: canReadStore, canWrite: canWriteStore } =
    useFeatureAccess("store");
  const shouldLoadQueue = hasAnyMerchantAccess && canReadStore;

  useBootstrapScanStoreContextWhenFocused({ enabled: shouldLoadQueue });

  const appliedOperationsRouteStoreRef = useRef<string | null>(null);
  useEffect(() => {
    if (!storeIdFromRoute) {
      appliedOperationsRouteStoreRef.current = null;
      return;
    }
    if (!stores.some((store) => store.id === storeIdFromRoute)) {
      return;
    }
    if (appliedOperationsRouteStoreRef.current === storeIdFromRoute) {
      return;
    }
    appliedOperationsRouteStoreRef.current = storeIdFromRoute;
    void setScanStoreContext(storeIdFromRoute);
  }, [stores, setScanStoreContext, storeIdFromRoute]);

  const queueStoreId = useMemo(
    () =>
      shouldLoadQueue
        ? effectiveScanStoreId(selectedScanStoreId, stores)
        : null,
    [stores, selectedScanStoreId, shouldLoadQueue],
  );

  const {
    data,
    loading,
    error,
    refetch: refetchActive,
    networkStatus,
  } = useActiveOrders({
    merchantStoreId: queueStoreId ?? undefined,
    skip: queueStoreId == null || !shouldLoadQueue,
  });

  const {
    data: closedData,
    refetch: refetchClosed,
  } = useRecentClosedOrders({
    merchantStoreId: queueStoreId ?? undefined,
    skip: queueStoreId == null || !shouldLoadQueue,
    limit: 50,
  });

  const refetchAll = useCallback(async () => {
    await Promise.all([refetchActive(), refetchClosed()]);
  }, [refetchActive, refetchClosed]);

  const { refreshing, onRefresh } = usePullToRefresh(refetchAll, {
    enabled: Boolean(queueStoreId) && shouldLoadQueue,
  });

  const [markOrderReady] = useMarkOrderReady();
  const [markOrderPickedUp] = useMarkOrderPickedUp();
  const [cancelOrder] = useCancelOrderVendor();
  const [markOrderDelayed] = useMarkOrderDelayed();
  const [markOrderResumePreparing] = useMarkOrderResumePreparing();
  const [revertOrderPickUp] = useRevertOrderPickUp();
  const [revertOrderReady] = useRevertOrderReady();

  const [busyOrderId, setBusyOrderId] = useState<string | null>(null);

  const runWithOrder = useCallback(
    async (orderId: string, task: () => Promise<unknown>) => {
      setBusyOrderId(orderId);
      try {
        await task();
        await refetchAll();
      } catch (error) {
        Alert.alert(
          t("Common.error"),
          resolveOrderQueueOperationErrorMessage(error, t),
        );
      } finally {
        setBusyOrderId(null);
      }
    },
    [refetchAll, t],
  );

  const orders = useMemo(() => data?.activeOrders ?? [], [data?.activeOrders]);
  const closedOrders = useMemo(
    () => closedData?.recentClosedOrders ?? [],
    [closedData?.recentClosedOrders],
  );

  const columns = useMemo<OrderQueueKanbanColumn[]>(() => {
    const preparing = orders.filter((order) => order.status === "PREPARING");
    const delayed = orders.filter((order) => order.status === "DELAYED");
    const ready = orders.filter((order) => order.status === "READY");
    return [
      { key: "READY", items: ready },
      { key: "PREPARING", items: preparing },
      { key: "DELAYED", items: delayed },
    ];
  }, [orders]);

  const isInitialLoading =
    loading
    && orders.length === 0
    && error == null
    && queueStoreId != null;
  const isRefetching = networkStatus === NetworkStatus.refetch;

  const handleMarkReady = useCallback(
    (orderId: string) => {
      void runWithOrder(orderId, async () => {
        await markOrderReady({
          variables: { input: { orderId } },
        });
      });
    },
    [markOrderReady, runWithOrder],
  );

  const handleMarkDelayed = useCallback(
    (orderId: string) => {
      void runWithOrder(orderId, async () => {
        await markOrderDelayed({
          variables: { input: { orderId } },
        });
      });
    },
    [markOrderDelayed, runWithOrder],
  );

  const handleResumePreparing = useCallback(
    (orderId: string) => {
      void runWithOrder(orderId, async () => {
        await markOrderResumePreparing({
          variables: { input: { orderId } },
        });
      });
    },
    [markOrderResumePreparing, runWithOrder],
  );

  const handleMarkPickedUp = useCallback(
    (orderId: string) => {
      void runWithOrder(orderId, async () => {
        await markOrderPickedUp({
          variables: { input: { orderId } },
        });
      });
    },
    [markOrderPickedUp, runWithOrder],
  );

  const handleCancelPress = useCallback(
    (order: VendorOrderGraphql) => {
      alertOrderQueueMutationConfirm({
        t,
        title: t("OrderQueue.confirmCancelTitle"),
        message: t("OrderQueue.confirmCancelBody", {
          number: String(order.orderNumber),
        }),
        confirmText: t("OrderQueue.confirmCancelDestructive"),
        confirmButtonStyle: "destructive",
        onConfirm: () => {
          void runWithOrder(order.id, async () => {
            await cancelOrder({
              variables: { input: { orderId: order.id } },
            });
          });
        },
      });
    },
    [cancelOrder, runWithOrder, t],
  );

  const handleRevertPickUpPress = useCallback(
    (order: VendorOrderGraphql) => {
      alertOrderQueueMutationConfirm({
        t,
        title: t("OrderQueue.revertPickUpTitle"),
        message: t("OrderQueue.revertPickUpBody", {
          number: String(order.orderNumber),
        }),
        confirmText: t("OrderQueue.revertPickUpConfirm"),
        onConfirm: () => {
          void runWithOrder(order.id, async () => {
            await revertOrderPickUp({
              variables: { input: { orderId: order.id } },
            });
          });
        },
      });
    },
    [revertOrderPickUp, runWithOrder, t],
  );

  const handleRevertReadyPress = useCallback(
    (order: VendorOrderGraphql) => {
      alertOrderQueueMutationConfirm({
        t,
        title: t("OrderQueue.revertReadyTitle"),
        message: t("OrderQueue.revertReadyBody", {
          number: String(order.orderNumber),
        }),
        confirmText: t("OrderQueue.revertReadyConfirm"),
        onConfirm: () => {
          void runWithOrder(order.id, async () => {
            await revertOrderReady({
              variables: { input: { orderId: order.id } },
            });
          });
        },
      });
    },
    [revertOrderReady, runWithOrder, t],
  );

  const mutationsEnabled = canWriteStore;
  const isResolvingStore =
    shouldLoadQueue && stores.length > 0 && queueStoreId == null;
  const hasNoEligibleStore = queueStoreId == null && stores.length === 0;

  return {
    shouldLoadQueue,
    queueStoreId,
    error: error ?? undefined,
    refetch: refetchAll,
    refreshing: refreshing || isRefetching,
    onRefresh,
    columns,
    closedOrders,
    showNoStoresLine: shouldLoadQueue && hasNoEligibleStore,
    showOrdersSkeleton:
      isResolvingStore || (queueStoreId != null && isInitialLoading),
    mutationsEnabled,
    busyOrderId,
    onMarkReady: mutationsEnabled ? handleMarkReady : undefined,
    onMarkDelayed: mutationsEnabled ? handleMarkDelayed : undefined,
    onResumePreparing: mutationsEnabled ? handleResumePreparing : undefined,
    onMarkPickedUp: mutationsEnabled ? handleMarkPickedUp : undefined,
    onCancelPress: mutationsEnabled ? handleCancelPress : undefined,
    onRevertPickUp: mutationsEnabled ? handleRevertPickUpPress : undefined,
    onRevertReady: mutationsEnabled ? handleRevertReadyPress : undefined,
  };
};
