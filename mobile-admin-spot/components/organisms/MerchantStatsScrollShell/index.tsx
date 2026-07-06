import { Typography } from "@/components/atoms/Typography";
import { MerchantStatsQueryErrorCard } from "@/components/molecules/MerchantStatsQueryErrorCard";
import { MerchantStatsSessionScrollHeader } from "@/components/organisms/MerchantStatsSessionScrollHeader";
import { useMerchantStatsSession } from "@/contexts/MerchantStatsSessionContext";
import { useCompanyScrollBottomInset } from "@/hooks/useCompanyScrollBottomInset";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import React, { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, RefreshControl, ScrollView, View } from "react-native";

import type { MerchantStatsScrollShellProps } from "./types";

export const MerchantStatsScrollShell = ({
  topContent,
  bundleContent,
  footerContent,
}: MerchantStatsScrollShellProps) => {
  const { t } = useTranslation();
  const scrollBottomInset = useCompanyScrollBottomInset();
  const {
    canReadMerchant,
    accessLoading,
    statsMerchantId,
    statsEnabled,
    bundle,
    loading,
    refresh,
    queryFailed,
    errorMessage,
  } = useMerchantStatsSession();

  const refreshAction = useCallback(async () => {
    await refresh();
  }, [refresh]);

  const { refreshing, onRefresh } = usePullToRefresh(refreshAction);

  const contentContainerStyle = useMemo(
    () => ({ paddingBottom: scrollBottomInset }),
    [scrollBottomInset],
  );

  const showGlobalError =
    statsEnabled && !loading && bundle === null && queryFailed;

  if (accessLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#EC2828" />
      </View>
    );
  }

  if (!canReadMerchant) {
    return (
      <View className="flex-1 items-center justify-center px-6">
        <Typography variant="text-16-regular" className="text-gray-600 text-center">
          {t("Company.noCompanyAccess")}
        </Typography>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-gray-50-light"
      contentContainerClassName="flex-grow-1 p-6 gap-5"
      contentContainerStyle={contentContainerStyle}
      showsVerticalScrollIndicator={false}
      nestedScrollEnabled
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <MerchantStatsSessionScrollHeader />
      {topContent}

      {!statsMerchantId ? (
        <Typography variant="text-16-regular" className="text-gray-600">
          {t("MerchantStats.noMerchant")}
        </Typography>
      ) : null}

      {statsEnabled && loading && bundle === null ? (
        <View className="py-8 items-center">
          <ActivityIndicator size="large" color="#EC2828" />
        </View>
      ) : null}

      {showGlobalError ? (
        <MerchantStatsQueryErrorCard message={errorMessage ?? t("MerchantStats.loadError")} />
      ) : null}

      {statsEnabled && bundle !== null ? bundleContent(bundle) : null}
      {footerContent}
    </ScrollView>
  );
};
