import { Typography } from "@/components/atoms/Typography";
import { ContextSwitcher } from "@/components/molecules/ContextSwitcher";
import { OrderQueueOrderCard } from "@/components/molecules/OrderQueueOrderCard";
import { OrderQueueWalkInToolbar } from "@/components/molecules/OrderQueueWalkInToolbar";
import { useOrderQueueOperations } from "@/hooks/useOrderQueueOperations";
import { useTabBarScrollBottomInset } from "@/hooks/useTabBarInset";
import { getErrorMessage } from "@/utils/apolloError";
import { buildOrderQueuePublicWebUrl } from "@/utils/orderQueuePublicWebUrl";
import type { TFunction } from "i18next";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, RefreshControl, ScrollView, View } from "react-native";

function queueSectionTitle(columnKey: string, t: TFunction): string {
  if (columnKey === "READY") {
    return t("OrderQueue.panelSectionReady");
  }
  if (columnKey === "PREPARING") {
    return t("OrderQueue.panelSectionPreparing");
  }
  if (columnKey === "DELAYED") {
    return t("OrderQueue.columnDelayed");
  }
  return t("OrderQueue.panelSectionOtherStatus", { status: columnKey });
}

export default function OrderQueueOperationsScreen() {
  const { t, i18n } = useTranslation();
  const q = useOrderQueueOperations();
  const scrollBottomInset = useTabBarScrollBottomInset();

  const publicQueueUrl = useMemo(() => {
    if (q.queueStoreId == null) {
      return null;
    }
    return buildOrderQueuePublicWebUrl(q.queueStoreId, i18n.language);
  }, [i18n.language, q.queueStoreId]);

  if (!q.shouldLoadQueue) {
    return (
      <View className="flex-1 items-center justify-center">
        <Typography
          variant="text-18-semibold"
          className="text-gray-900 text-center"
        >
          {t("Store.noMerchant")}
        </Typography>
      </View>
    );
  }

  if (q.error != null && q.queueStoreId != null) {
    return (
      <View className="flex-1">
        <View className="flex-1 items-center justify-center gap-4 px-6">
          <Typography
            variant="text-18-semibold"
            className="text-gray-900 text-center"
          >
            {getErrorMessage(q.error) ?? t("OrderQueue.operationsLoadError")}
          </Typography>
          <Pressable
            onPress={() => {
              void q.refetch();
            }}
            className="bg-blue-900 rounded-2xl px-5 py-3"
          >
            <Typography variant="text-16-semibold" className="text-white">
              {t("Common.tryAgain")}
            </Typography>
          </Pressable>
        </View>
      </View>
    );
  }
  return (
    <>
      <ScrollView
        className="flex-1 bg-gray-50-light"
        contentContainerClassName="flex-grow-1"
        contentContainerStyle={{ paddingBottom: scrollBottomInset }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={q.refreshing} onRefresh={q.onRefresh} />
        }
      >
        <View className="px-6 pt-4 pb-4 gap-4">
          <OrderQueueWalkInToolbar
            showPlusButton={q.queueStoreId != null}
            publicUrl={publicQueueUrl}
          />

          <ContextSwitcher storeOnly />

          {q.showNoStoresLine ? (
            <Typography variant="text-16-regular" className="text-gray-650">
              {t("Store.noStores")}
            </Typography>
          ) : null}

          <View className="gap-3.5">
            {q.columns.map((column) => (
              <View key={column.key} className="gap-3.5">
                <Typography
                  variant={
                    column.key === "READY"
                      ? "text-26-bold-24.7"
                      : "text-20-bold-19"
                  }
                  className={
                    column.key === "READY"
                      ? "self-start text-black uppercase tracking-0.2"
                      : "self-stretch text-steel-muted uppercase tracking-0.2"
                  }
                >
                  {queueSectionTitle(column.key, t)}
                </Typography>
                {column.items.length === 0 ? (
                  <Typography
                    variant="text-14-regular-spaced"
                    className="w-full text-gray-500 italic"
                  >
                    {t("OrderQueue.emptyColumn")}
                  </Typography>
                ) : (
                  <View className="flex-row flex-wrap gap-2">
                    {column.items.map((order) => (
                      <View key={order.id} className="min-w-0 w-[48%]">
                        <OrderQueueOrderCard
                          order={order}
                          canMutate={q.mutationsEnabled}
                          busy={q.busyOrderId === order.id}
                          queueRole="board"
                          onMarkReady={q.onMarkReady}
                          onMarkDelayed={q.onMarkDelayed}
                          onResumePreparing={q.onResumePreparing}
                          onMarkPickedUp={q.onMarkPickedUp}
                          onCancel={q.onCancelPress}
                          onRevertPickUp={q.onRevertPickUp}
                          onRevertReady={q.onRevertReady}
                        />
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>

          <View className="gap-3.5">
            <Typography
              variant="text-20-bold-19"
              className="self-stretch text-steel-muted uppercase tracking-0.2"
            >
              {t("OrderQueue.panelSectionCompleted")}
            </Typography>
            {q.closedOrders.length === 0 ? (
              <Typography
                variant="text-14-regular-spaced"
                className="w-full text-gray-500 italic"
              >
                {t("OrderQueue.emptyCompletedColumn")}
              </Typography>
            ) : (
              <View className="flex-row flex-wrap gap-2 self-stretch">
                {q.closedOrders.map((order) => (
                  <View key={order.id} className="min-w-0 w-[48%]">
                    <OrderQueueOrderCard
                      order={order}
                      canMutate={q.mutationsEnabled}
                      busy={q.busyOrderId === order.id}
                      queueRole="history"
                      onRevertPickUp={q.onRevertPickUp}
                    />
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </>
  );
}
