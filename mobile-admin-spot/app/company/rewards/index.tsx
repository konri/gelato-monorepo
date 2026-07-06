import { CircularIconButton } from "@/components/atoms/CircularIconButton";
import { Typography } from "@/components/atoms/Typography";
import { ConfirmModal } from "@/components/molecules/ConfirmModal";
import { ContextSwitcher } from "@/components/molecules/ContextSwitcher";
import { FiltersPillTrigger } from "@/components/molecules/FiltersPillTrigger";
import { RewardGrid } from "@/components/molecules/RewardGrid";
import { RewardsLoyaltyListFilterModal } from "@/components/organisms/RewardsLoyaltyListFilterModal";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { useDeleteReward } from "@/hooks/graphql/mutations/useDeleteReward";
import { useGetMyRewards } from "@/hooks/graphql/queries/useGetMyRewards";
import { useLoyaltyStoreContext } from "@/hooks/useLoyaltyStoreContext";
import { useCompanyScrollBottomInset } from "@/hooks/useCompanyScrollBottomInset";
import { useLoyaltyListFilterModal } from "@/hooks/useLoyaltyListFilterModal";
import { useLoyaltyListRefetchOnFocus } from "@/hooks/useLoyaltyListRefetchOnFocus";
import { useLoyaltyListScreenFilters } from "@/hooks/useLoyaltyListScreenFilters";
import { useOperatorAccess } from "@/hooks/useOperatorAccess";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { useScrollViewContentMinHeight } from "@/hooks/useScrollViewContentMinHeight";
import type { Reward } from "@/shared/api-client/src/graphql/queries/myRewards";
import {
  createEmptyLoyaltyListFilters,
  filterRewardsByLoyaltyFilters,
  type LoyaltyListAppliedFilters,
} from "@/utils/loyaltyListFilterApply";
import { resolveRewardScopeLabel } from "@/utils/loyaltyListingScope";
import React, { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Alert, RefreshControl, ScrollView, View } from "react-native";

export default function RewardsScreen() {
  const { t } = useTranslation();
  const { canRead: canReadRewards } = useFeatureAccess("rewards");
  const { selectedStoreId, availableStores } = useOperatorAccess();
  const [deleteTarget, setDeleteTarget] = useState<Reward | null>(null);
  const { filterModalOpen, openFilterModal, closeFilterModal } = useLoyaltyListFilterModal();
  const [appliedFilters, setAppliedFilters] = useState<LoyaltyListAppliedFilters>(() =>
    createEmptyLoyaltyListFilters(),
  );

  const {
    hasAnyMerchantAccess,
    canEditGlobal,
    getScopeLabel,
    handleSelectEntity,
    handleCreateEntity: handleCreateReward,
    isCreateDisabled,
    storeContextModalProps,
  } = useLoyaltyStoreContext({
    loyaltyEntity: "rewards",
  });

  const shouldLoadRewards = hasAnyMerchantAccess && canReadRewards;
  const {
    loading: rewardsLoading,
    rewards: rewardsRaw,
    refetch: refetchRewards,
  } = useGetMyRewards({
    skip: !shouldLoadRewards,
  });
  const {
    loading: globalRewardsLoading,
    rewards: globalRewards,
    refetch: refetchGlobalRewards,
  } = useGetMyRewards({
    skip: !shouldLoadRewards || !selectedStoreId,
    storeId: null,
  });

  const globalRewardById = useMemo(
    () => new Map(globalRewards.map((reward) => [reward.id, reward])),
    [globalRewards],
  );

  const globalBaselineReady = !selectedStoreId || !globalRewardsLoading;

  const { filterRuntime, activeFilterCount, hideStoreFilterSection } = useLoyaltyListScreenFilters({
    appliedFilters,
    selectedStoreId,
    kind: "rewards",
    globalRewardById,
    globalStoreScopeBaselineReady: globalBaselineReady,
  });

  const rewards = useMemo(() => {
    const list = rewardsRaw.filter((reward): reward is Reward => reward != null);
    return filterRewardsByLoyaltyFilters(list, filterRuntime);
  }, [rewardsRaw, filterRuntime]);

  const selectedStoreName = useMemo(
    () => availableStores.find((store) => store.id === selectedStoreId)?.name,
    [availableStores, selectedStoreId],
  );

  const resolveRewardScopeLabelMemo = useCallback(
    (reward: Reward): string =>
      resolveRewardScopeLabel(
        reward,
        selectedStoreId,
        selectedStoreName,
        globalRewardById,
        getScopeLabel,
        t,
        globalBaselineReady,
      ),
    [getScopeLabel, globalBaselineReady, globalRewardById, selectedStoreId, selectedStoreName, t],
  );

  const [deleteReward, { loading: isDeleting }] = useDeleteReward();
  const isLoading =
    rewardsLoading || (Boolean(selectedStoreId) && shouldLoadRewards && globalRewardsLoading);

  const refetchAll = useCallback(async () => {
    const tasks: Promise<unknown>[] = [refetchRewards()];
    if (selectedStoreId) {
      tasks.push(refetchGlobalRewards());
    }
    await Promise.all(tasks);
  }, [refetchRewards, refetchGlobalRewards, selectedStoreId]);

  useLoyaltyListRefetchOnFocus(refetchRewards, {
    refetchSecondary: refetchGlobalRewards,
    secondaryWhen: Boolean(selectedStoreId),
    enabled: shouldLoadRewards,
  });

  const { refreshing, onRefresh } = usePullToRefresh(refetchAll, {
    enabled: shouldLoadRewards,
  });
  const scrollBottomInset = useCompanyScrollBottomInset();
  const { onScrollViewLayout, contentContainerStyle } =
    useScrollViewContentMinHeight(scrollBottomInset);

  const handleSelectReward = useCallback(
    (reward: Reward) => handleSelectEntity(reward.id),
    [handleSelectEntity],
  );

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await deleteReward({ variables: { id: deleteTarget.id } });
      setDeleteTarget(null);
    } catch {
      setDeleteTarget(null);
      Alert.alert(t("Common.error"), t("Loyalty.deleteRewardInUse"));
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#1A4196" />
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
            {t("Company.rewards")}
          </Typography>
          <View className="flex-row items-center gap-2">
            <FiltersPillTrigger
              onPress={openFilterModal}
              activeFilterCount={activeFilterCount}
              labelKey="Cooperators.filter"
            />
            <CircularIconButton
              onPress={handleCreateReward}
              size={32}
              backgroundColor="#1A4196"
              disabled={isCreateDisabled}
            />
          </View>
        </View>
        <ContextSwitcher />

        {rewards.length === 0 ? (
          <View className="items-center justify-center gap-2 pt-8">
            <Typography
              variant="text-18-semibold"
              className="text-gray-900 text-center"
            >
              {t("Company.noRewards")}
            </Typography>
            <Typography
              variant="text-14-regular-spaced"
              className="text-gray-600 text-center"
            >
              {t("Company.createFirstReward")}
            </Typography>
          </View>
        ) : (
          <RewardGrid
            rewards={rewards}
            onSelect={handleSelectReward}
            onDelete={canEditGlobal ? setDeleteTarget : undefined}
            getScopeLabel={resolveRewardScopeLabelMemo}
          />
        )}
      </ScrollView>

      <RewardsLoyaltyListFilterModal
        visible={filterModalOpen}
        onClose={closeFilterModal}
        onApply={setAppliedFilters}
        appliedFilters={appliedFilters}
        availableStores={availableStores}
        hideStoreSection={hideStoreFilterSection}
        storeExclusiveFilterVisible={hideStoreFilterSection}
      />

      <ConfirmModal
        visible={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title={t("Loyalty.deleteRewardTitle")}
        message={t("Loyalty.deleteRewardConfirmation", {
          title: deleteTarget?.title,
        })}
        confirmText={t("Common.delete")}
        cancelText={t("Common.cancel")}
        confirmVariant="danger"
        isLoading={isDeleting}
      />
      <ConfirmModal {...storeContextModalProps} />
    </>
  );
}
