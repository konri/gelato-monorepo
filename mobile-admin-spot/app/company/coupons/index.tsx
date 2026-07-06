import { CircularIconButton } from "@/components/atoms/CircularIconButton";
import { Typography } from "@/components/atoms/Typography";
import { ConfirmModal } from "@/components/molecules/ConfirmModal";
import { ContextSwitcher } from "@/components/molecules/ContextSwitcher";
import { FiltersPillTrigger } from "@/components/molecules/FiltersPillTrigger";
import { MerchantCouponListItem } from "@/components/molecules/MerchantCouponListItem";
import { CouponsLoyaltyListFilterModal } from "@/components/organisms/CouponsLoyaltyListFilterModal";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { useGetMyMerchantCoupons } from "@/hooks/graphql/queries/useGetMyMerchantCoupons";
import { useLoyaltyStoreContext } from "@/hooks/useLoyaltyStoreContext";
import { useCompanyScrollBottomInset } from "@/hooks/useCompanyScrollBottomInset";
import { useOperatorAccess } from "@/hooks/useOperatorAccess";
import { useLoyaltyListFilterModal } from "@/hooks/useLoyaltyListFilterModal";
import { useLoyaltyListRefetchOnFocus } from "@/hooks/useLoyaltyListRefetchOnFocus";
import { useLoyaltyListScreenFilters } from "@/hooks/useLoyaltyListScreenFilters";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { useScrollViewContentMinHeight } from "@/hooks/useScrollViewContentMinHeight";
import type { Coupon } from "@/shared/api-client/src/graphql/mutations/coupon";
import {
  createEmptyLoyaltyListFilters,
  filterCouponsByLoyaltyFilters,
  type LoyaltyListAppliedFilters,
} from "@/utils/loyaltyListFilterApply";
import { resolveCouponScopeLabel } from "@/utils/loyaltyListingScope";
import React, { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, RefreshControl, ScrollView, View } from "react-native";

export default function CouponsScreen() {
  const { t } = useTranslation();
  const { canRead: canReadCoupons } = useFeatureAccess("coupons");
  const { selectedStoreId, availableStores } = useOperatorAccess();
  const { filterModalOpen, openFilterModal, closeFilterModal } = useLoyaltyListFilterModal();
  const [appliedFilters, setAppliedFilters] = useState<LoyaltyListAppliedFilters>(() =>
    createEmptyLoyaltyListFilters(),
  );

  const {
    hasAnyMerchantAccess,
    getScopeLabel,
    handleSelectEntity: handleSelectCoupon,
    handleCreateEntity: handleCreateCoupon,
    isCreateDisabled,
    storeContextModalProps,
  } = useLoyaltyStoreContext({
    loyaltyEntity: "coupons",
  });

  const shouldLoadCoupons = hasAnyMerchantAccess && canReadCoupons;
  const {
    loading: couponsLoading,
    merchantCoupons: coupons,
    refetch: refetchCoupons,
  } = useGetMyMerchantCoupons({
    skip: !shouldLoadCoupons,
  });
  const {
    loading: globalCouponsLoading,
    merchantCoupons: globalCoupons,
    refetch: refetchGlobalCoupons,
  } = useGetMyMerchantCoupons({
    skip: !shouldLoadCoupons || !selectedStoreId,
    storeId: null,
  });

  const globalCouponById = useMemo(
    () => new Map(globalCoupons.map((coupon) => [coupon.id, coupon])),
    [globalCoupons],
  );

  const globalBaselineReady = !selectedStoreId || !globalCouponsLoading;

  const { filterRuntime, activeFilterCount, hideStoreFilterSection } = useLoyaltyListScreenFilters({
    appliedFilters,
    selectedStoreId,
    kind: "coupons",
    globalCouponById,
    globalStoreScopeBaselineReady: globalBaselineReady,
  });

  const visibleCoupons = useMemo(
    () => filterCouponsByLoyaltyFilters(coupons, filterRuntime),
    [coupons, filterRuntime],
  );
  const selectedStoreName = useMemo(
    () => availableStores.find((store) => store.id === selectedStoreId)?.name,
    [availableStores, selectedStoreId],
  );
  const resolveCouponScopeLabelMemo = useCallback(
    (coupon: Coupon): string =>
      resolveCouponScopeLabel(
        coupon,
        selectedStoreId,
        selectedStoreName,
        globalCouponById,
        getScopeLabel,
        t,
        globalBaselineReady,
      ),
    [getScopeLabel, globalBaselineReady, globalCouponById, selectedStoreId, selectedStoreName, t],
  );

  const refetchAll = useCallback(async () => {
    const tasks: Promise<unknown>[] = [refetchCoupons()];
    if (selectedStoreId) {
      tasks.push(refetchGlobalCoupons());
    }
    await Promise.all(tasks);
  }, [refetchCoupons, refetchGlobalCoupons, selectedStoreId]);

  useLoyaltyListRefetchOnFocus(refetchCoupons, {
    refetchSecondary: refetchGlobalCoupons,
    secondaryWhen: Boolean(selectedStoreId),
    enabled: shouldLoadCoupons,
  });

  const { refreshing, onRefresh } = usePullToRefresh(refetchAll, {
    enabled: shouldLoadCoupons,
  });
  const scrollBottomInset = useCompanyScrollBottomInset();
  const { onScrollViewLayout, contentContainerStyle } =
    useScrollViewContentMinHeight(scrollBottomInset);

  const loading =
    couponsLoading || (Boolean(selectedStoreId) && shouldLoadCoupons && globalCouponsLoading);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <>
      <ScrollView
        className="flex-1 bg-gray-50-light"
        contentContainerClassName="flex-grow-1 p-6 gap-4"
        contentContainerStyle={contentContainerStyle}
        onLayout={onScrollViewLayout}
        showsVerticalScrollIndicator={false}
        alwaysBounceVertical
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View className="flex-row justify-between items-center">
          <Typography variant="text-20-bold" className="text-black">
            {t("Company.coupons")}
          </Typography>
          <View className="flex-row items-center gap-2">
            <FiltersPillTrigger
              onPress={openFilterModal}
              activeFilterCount={activeFilterCount}
              labelKey="Cooperators.filter"
            />
            <CircularIconButton
              onPress={handleCreateCoupon}
              size={32}
              backgroundColor="bg-blue-900"
              disabled={isCreateDisabled}
            />
          </View>
        </View>
        <ContextSwitcher />

        {visibleCoupons.length === 0 ? (
          <View className="items-center justify-center gap-2 pt-8">
            <Typography variant="text-18-semibold" className="text-gray-900 text-center">
              {t("Coupon.noCoupons")}
            </Typography>
            <Typography variant="text-14-regular-spaced" className="text-gray-600 text-center">
              {t("Coupon.createFirstCoupon")}
            </Typography>
          </View>
        ) : (
          <View className="gap-4">
            {visibleCoupons.map((coupon) => (
              <MerchantCouponListItem
                key={coupon.id}
                coupon={coupon}
                onPress={handleSelectCoupon}
                scopeLabel={resolveCouponScopeLabelMemo(coupon)}
              />
            ))}
          </View>
        )}
      </ScrollView>
      <CouponsLoyaltyListFilterModal
        visible={filterModalOpen}
        onClose={closeFilterModal}
        onApply={setAppliedFilters}
        appliedFilters={appliedFilters}
        availableStores={availableStores}
        hideStoreSection={hideStoreFilterSection}
        storeExclusiveFilterVisible={hideStoreFilterSection}
      />
      <ConfirmModal {...storeContextModalProps} />
    </>
  );
}
