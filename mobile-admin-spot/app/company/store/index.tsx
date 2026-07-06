import { CircularIconButton } from "@/components/atoms/CircularIconButton";
import { Typography } from "@/components/atoms/Typography";
import { StoreCard } from "@/components/molecules/StoreCard";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { useGetMerchantStores } from "@/hooks/graphql/queries/useGetMerchantStores";
import { useOperatorAccess } from "@/hooks/useOperatorAccess";
import { useCompanyScrollBottomInset } from "@/hooks/useCompanyScrollBottomInset";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import type { MerchantStoreBasic } from "@/shared/api-client/src/graphql/mutations/merchantStore";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  View,
} from "react-native";

export default function StoreListScreen() {
  const { t } = useTranslation();
  const { hasAnyMerchantAccess } = useOperatorAccess();
  const { canRead: canReadStore, canWrite: canWriteStore } = useFeatureAccess("store");
  const shouldLoadStores = hasAnyMerchantAccess && canReadStore;
  const {
    data: storesData,
    loading: storesLoading,
    refetch: refetchStores,
  } = useGetMerchantStores({ skip: !shouldLoadStores });
  const stores = (storesData?.myStores || []).filter(
    (store): store is MerchantStoreBasic => !!store.id,
  );

  const { refreshing, onRefresh } = usePullToRefresh(refetchStores, {
    enabled: shouldLoadStores,
  });
  const scrollBottomInset = useCompanyScrollBottomInset();

  const handleEdit = (store: MerchantStoreBasic) => {
    router.push(`/company/store/form?storeId=${store.id}`);
  };

  const handleAdd = () => {
    router.push("/company/store/form");
  };

  if (storesLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#1A4196" />
      </View>
    );
  }

  if (!shouldLoadStores) {
    return (
      <View className="flex-1 items-center justify-center px-6">
        <Typography variant="text-18-semibold" className="text-gray-900">
          {t("Store.noMerchant")}
        </Typography>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-gray-50-light"
      contentContainerClassName="flex-grow-1 p-6 gap-4"
      contentContainerStyle={{ paddingBottom: scrollBottomInset }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View className="flex-row justify-between items-center">
        <Typography variant="text-20-bold" className="text-black">
          {t("Company.salesPoints")}
        </Typography>
        <CircularIconButton onPress={handleAdd} size={32} disabled={!canWriteStore} />
      </View>

      {stores.length === 0 ? (
        <View className="items-center justify-center">
          <Typography variant="text-18-semibold" className="text-gray-900 mb-2">
            {t("Store.noStores")}
          </Typography>
          <Typography variant="text-18-regular" className="text-gray-600">
            {t("Store.addFirstStore")}
          </Typography>
        </View>
      ) : (
        stores.map((store) => (
          <StoreCard
            key={store.id}
            store={store}
            onPress={() => handleEdit(store)}
          />
        ))
      )}

      <Pressable
        onPress={canWriteStore ? handleAdd : undefined}
        disabled={!canWriteStore}
        className="bg-white rounded-2xl p-2 flex-row items-center gap-2 shadow-sm"
      >
        <View className="w-32 h-20 rounded-lg bg-gray-100 items-center justify-center">
          <View className="w-12 h-12 rounded-full bg-white items-center justify-center">
            <Ionicons name="add" size={20} color="#000000" />
          </View>
        </View>

        <View className="flex-1">
          <Typography variant="text-12-bold" className="text-gray-650">
            {t("Store.addNewLocation")}
          </Typography>
        </View>

        <View className="justify-center self-stretch">
          <Ionicons name="chevron-forward" size={14} color="#000000" />
        </View>
      </Pressable>
    </ScrollView>
  );
}
