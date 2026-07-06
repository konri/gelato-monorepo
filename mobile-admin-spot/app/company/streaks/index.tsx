import { CircularIconButton } from "@/components/atoms/CircularIconButton";
import { Typography } from "@/components/atoms/Typography";
import { ConfirmModal } from "@/components/molecules/ConfirmModal";
import { ContextSwitcher } from "@/components/molecules/ContextSwitcher";
import { FiltersPillTrigger } from "@/components/molecules/FiltersPillTrigger";
import { StreakListProgramTimeline } from "@/components/molecules/StreakListProgramTimeline";
import { StreaksLoyaltyListFilterModal } from "@/components/organisms/StreaksLoyaltyListFilterModal";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { useDeleteStreakProgram } from "@/hooks/graphql/mutations/useDeleteStreakProgram";
import { useGetMyStreakPrograms } from "@/hooks/graphql/queries/useGetMyStreakPrograms";
import { useLoyaltyStoreContext } from "@/hooks/useLoyaltyStoreContext";
import { useCompanyScrollBottomInset } from "@/hooks/useCompanyScrollBottomInset";
import { useLoyaltyListFilterModal } from "@/hooks/useLoyaltyListFilterModal";
import { useLoyaltyListRefetchOnFocus } from "@/hooks/useLoyaltyListRefetchOnFocus";
import { useLoyaltyListScreenFilters } from "@/hooks/useLoyaltyListScreenFilters";
import { useOperatorAccess } from "@/hooks/useOperatorAccess";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { useScrollViewContentMinHeight } from "@/hooks/useScrollViewContentMinHeight";
import type { StreakProgram } from "@/shared/api-client/src/graphql/queries/streaks";
import {
  createEmptyLoyaltyListFilters,
  filterStreakProgramsByLoyaltyFilters,
  type LoyaltyListAppliedFilters,
} from "@/utils/loyaltyListFilterApply";
import { resolveStreakScopeLabel } from "@/utils/loyaltyListingScope";
import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  TouchableOpacity,
  View,
} from "react-native";

export default function StreaksScreen() {
  const { t } = useTranslation();
  const { canRead: canReadStreaks } = useFeatureAccess("streaks");
  const { selectedStoreId, availableStores } = useOperatorAccess();
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name?: string } | null>(null);
  const { filterModalOpen, openFilterModal, closeFilterModal } = useLoyaltyListFilterModal();
  const [appliedFilters, setAppliedFilters] = useState<LoyaltyListAppliedFilters>(() =>
    createEmptyLoyaltyListFilters(),
  );

  const {
    hasAnyMerchantAccess,
    canEditGlobal,
    getScopeLabel,
    handleSelectEntity: handleSelectProgram,
    handleCreateEntity: handleCreateStreak,
    isCreateDisabled,
    storeContextModalProps,
  } = useLoyaltyStoreContext({
    loyaltyEntity: "streaks",
  });

  const shouldLoadStreaks = hasAnyMerchantAccess && canReadStreaks;
  const { data, loading, refetch: refetchStreaks } = useGetMyStreakPrograms({
    skip: !shouldLoadStreaks,
  });
  const {
    data: globalStreaksData,
    loading: globalStreaksLoading,
    refetch: refetchGlobalStreaks,
  } = useGetMyStreakPrograms({
    skip: !shouldLoadStreaks || !selectedStoreId,
    storeId: null,
  });

  const globalStreakById = useMemo(() => {
    const raw = globalStreaksData?.myMerchantStreaks ?? [];
    const entries = raw.filter(
      (program): program is StreakProgram => typeof program?.id === "string",
    );
    return new Map(entries.map((program) => [program.id, program]));
  }, [globalStreaksData?.myMerchantStreaks]);

  const globalBaselineReady = !selectedStoreId || !globalStreaksLoading;

  const { filterRuntime, activeFilterCount, hideStoreFilterSection } = useLoyaltyListScreenFilters({
    appliedFilters,
    selectedStoreId,
    kind: "streaks",
    globalStoreScopeBaselineReady: globalBaselineReady,
  });

  const programs = useMemo(() => {
    const raw = (data?.myMerchantStreaks ?? []).filter(
      (program): program is StreakProgram => typeof program?.id === "string",
    );
    const filtered = filterStreakProgramsByLoyaltyFilters(raw, filterRuntime);
    return [...filtered].sort((firstProgram, secondProgram) => {
      const firstWeight = firstProgram.isActive ? 1 : 0;
      const secondWeight = secondProgram.isActive ? 1 : 0;

      return secondWeight - firstWeight;
    });
  }, [data?.myMerchantStreaks, filterRuntime]);

  const selectedStoreName = useMemo(
    () => availableStores.find((store) => store.id === selectedStoreId)?.name,
    [availableStores, selectedStoreId],
  );

  const resolveStreakScopeLabelMemo = useCallback(
    (program: StreakProgram): string =>
      resolveStreakScopeLabel(
        program,
        selectedStoreId,
        selectedStoreName,
        globalStreakById,
        getScopeLabel,
        t,
        globalBaselineReady,
      ),
    [getScopeLabel, globalBaselineReady, globalStreakById, selectedStoreId, selectedStoreName, t],
  );

  const [deleteStreakProgram, { loading: isDeleting }] = useDeleteStreakProgram();

  const isLoading =
    loading || (Boolean(selectedStoreId) && shouldLoadStreaks && globalStreaksLoading);

  const refetchAll = useCallback(async () => {
    const tasks: Promise<unknown>[] = [refetchStreaks()];
    if (selectedStoreId) {
      tasks.push(refetchGlobalStreaks());
    }
    await Promise.all(tasks);
  }, [refetchStreaks, refetchGlobalStreaks, selectedStoreId]);

  useLoyaltyListRefetchOnFocus(refetchStreaks, {
    refetchSecondary: refetchGlobalStreaks,
    secondaryWhen: Boolean(selectedStoreId),
    enabled: shouldLoadStreaks,
  });

  const { refreshing, onRefresh } = usePullToRefresh(refetchAll, {
    enabled: shouldLoadStreaks,
  });
  const scrollBottomInset = useCompanyScrollBottomInset();
  const { onScrollViewLayout, contentContainerStyle } =
    useScrollViewContentMinHeight(scrollBottomInset);

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await deleteStreakProgram({
        variables: {
          streakProgramId: deleteTarget.id,
        },
      });
      setDeleteTarget(null);
    } catch {
      setDeleteTarget(null);
      Alert.alert(t("Common.error"), t("Streak.deleteProgramError"));
    }
  };

  if (isLoading) {
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
            {t("Company.streaks")}
          </Typography>
          <View className="flex-row items-center gap-2">
            <FiltersPillTrigger
              onPress={openFilterModal}
              activeFilterCount={activeFilterCount}
              labelKey="Cooperators.filter"
            />
            <CircularIconButton
              onPress={handleCreateStreak}
              size={32}
              backgroundColor="bg-blue-900"
              disabled={isCreateDisabled}
            />
          </View>
        </View>
        <ContextSwitcher />

        {programs.length === 0 ? (
          <View className="items-center justify-center gap-2 pt-8">
            <Typography variant="text-18-semibold" className="text-gray-900 text-center">
              {t("Streak.noPrograms")}
            </Typography>
            <Typography variant="text-14-regular-spaced" className="text-gray-600 text-center">
              {t("Streak.createFirstProgram")}
            </Typography>
          </View>
        ) : (
          <View className="gap-3">
            {programs.map((program) => {
              const isProgramActive = program.isActive;
              const stages = program.stages ?? [];
              const stageDays = new Set(
                stages
                  .map((stage) => stage.dayThreshold)
                  .filter(
                    (dayThreshold): dayThreshold is number =>
                      typeof dayThreshold === "number" &&
                      Number.isFinite(dayThreshold) &&
                      dayThreshold > 0,
                  ),
              );
              const totalDays = Math.max(1, program.requiredConsecutiveDays ?? 1);
              const programId = program.id;
              const frequencyKeySuffix = program.streakingInterval === 1 ? "Single" : "Multiple";

              return (
                <View
                  key={program.id}
                  className={`rounded-2xl p-3 flex-row gap-3 shadow-sm border ${isProgramActive ? "bg-white border-transparent" : "bg-gray-100 border-gray-200"}`}
                >
                  <TouchableOpacity
                    onPress={() => {
                      if (program.id) handleSelectProgram(program.id);
                    }}
                    className="flex-1 gap-3"
                  >
                    <Typography
                      variant="text-20-bold"
                      className={isProgramActive ? "text-gray-900" : "text-gray-600"}
                    >
                      {program.name}
                    </Typography>

                    <StreakListProgramTimeline
                      programId={programId}
                      totalDays={totalDays}
                      stages={stages}
                      isProgramActive={isProgramActive}
                    />

                    <View className="flex-row flex-wrap items-center gap-1.5">
                      <View
                        className={`px-3 py-1 rounded-full border ${isProgramActive ? "border-green-200 bg-green-50" : "border-gray-300 bg-gray-200"}`}
                      >
                        <Typography
                          variant="text-12-bold"
                          className={isProgramActive ? "text-green-700" : "text-gray-700"}
                        >
                          {t(isProgramActive ? "Streak.statusActive" : "Streak.statusInactive")}
                        </Typography>
                      </View>

                      <View className="px-3 py-1 rounded-full border border-gray-300">
                        <Typography variant="text-12-bold" className="text-gray-700">
                          {t("Streak.stepsCount", { count: totalDays })}
                        </Typography>
                      </View>

                      <View className="px-3 py-1 rounded-full border border-gray-300">
                        <Typography variant="text-12-bold" className="text-gray-700">
                          {t(`Streak.frequencyChip${program.streakingPolicy}${frequencyKeySuffix}`, {
                            interval: program.streakingInterval,
                          })}
                        </Typography>
                      </View>

                      <View className="px-3 py-1 rounded-full border border-red-500">
                        <Typography
                          variant="text-12-bold"
                          className={isProgramActive ? "text-red-500" : "text-gray-600"}
                        >
                          {t("Streak.rewardCount", { count: stageDays.size })}
                        </Typography>
                      </View>

                      <View className="px-3 py-1 rounded-full border border-gray-300">
                        <Typography variant="text-12-bold" className="text-gray-700">
                          {resolveStreakScopeLabelMemo(program)}
                        </Typography>
                      </View>
                    </View>
                  </TouchableOpacity>

                  <View className="items-center justify-between py-0.5">
                    {canEditGlobal ? (
                      <Pressable
                        onPress={() => {
                          if (!program.id) return;
                          setDeleteTarget({ id: program.id, name: program.name });
                        }}
                        disabled={isDeleting}
                        className="w-9 h-9 rounded-full bg-red-50 items-center justify-center"
                      >
                        <Ionicons name="trash-outline" size={16} color="#EF4444" />
                      </Pressable>
                    ) : (
                      <View className="w-9 h-9" />
                    )}
                    <View className="w-9 h-9 items-center justify-center">
                      <Ionicons name="chevron-forward" size={18} color="#B3B3B3" />
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      <StreaksLoyaltyListFilterModal
        visible={filterModalOpen}
        onClose={closeFilterModal}
        onApply={setAppliedFilters}
        appliedFilters={appliedFilters}
        availableStores={availableStores}
        hideStoreSection={hideStoreFilterSection}
      />

      <ConfirmModal
        visible={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title={t("Streak.deleteProgramTitle")}
        message={t("Streak.deleteProgramConfirmation", {
          title: deleteTarget?.name,
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
