import { RewardPicker } from "@/components/molecules/RewardPicker";
import { useGetMyRewards } from "@/hooks/graphql/queries/useGetMyRewards";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import type { Reward } from "@/shared/api-client/src/graphql/queries/myRewards";
import { applyRewardToStampCardForm } from "@/utils/rewardMapping";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, View } from "react-native";
import { useStampCardForm } from "./_layout";

export default function RewardPickerScreen() {
  const { t } = useTranslation();
  const form = useStampCardForm();
  const { forMilestone, mode, templateId, lockCriticalFields } = useLocalSearchParams<{
    forMilestone?: string;
    mode?: string;
    templateId?: string;
    lockCriticalFields?: string;
  }>();
  const baseParams =
    mode === "edit" && templateId
      ? {
          mode,
          templateId,
          lockCriticalFields: lockCriticalFields ?? "false",
        }
      : undefined;
  const isForMilestone = forMilestone === "true";

  const { data: rewardsData, loading, dataState, refetch: refetchRewards } =
    useGetMyRewards({});

  const rewards: Reward[] =
    dataState === "complete"
      ? (rewardsData?.myRewards ?? []).filter(
          (reward): reward is Reward => reward != null,
        )
      : [];

  const getPreselectedReward = useMemo(() => {
    if (isForMilestone) {
      const milestone = form.getValues("milestones")?.[0];
      if (!milestone) return null;

      if (!milestone.rewardId) return null;
      return rewards.find((reward) => reward.id === milestone.rewardId) ?? null;
    }

    const rewardId = form.getValues("rewardId");
    if (!rewardId) return null;
    return rewards.find((reward) => reward.id === rewardId) ?? null;
  }, [form, isForMilestone, rewards]);

  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);

  const { refreshing, onRefresh } = usePullToRefresh(refetchRewards);

  useEffect(() => {
    if (!selectedReward && getPreselectedReward) {
      setSelectedReward(getPreselectedReward);
    }
  }, [getPreselectedReward, selectedReward]);

  useEffect(() => {
    if (!loading && rewards.length === 0) {
      if (isForMilestone) {
        router.replace({
          pathname: "/company/stamp-card-template/reward",
          params: { next: "stampSummary", ...baseParams },
        });
      } else if (baseParams) {
        router.replace({
          pathname: "/company/stamp-card-template/reward",
          params: baseParams,
        });
      } else {
        router.replace("/company/stamp-card-template/reward");
      }
    }
  }, [baseParams, isForMilestone, loading, rewards.length]);

  const handleSelect = (reward: Reward) => {
    setSelectedReward(reward);
  };

  const handleNext = () => {
    if (!selectedReward) {
      return;
    }

    applyRewardToStampCardForm(form, selectedReward, isForMilestone);

    router.push({
      pathname: isForMilestone
        ? "/company/stamp-card-template/stampSummary"
        : "/company/stamp-card-template/milestone",
      params: baseParams,
    });
  };

  const handleCreateNew = () => {
    if (isForMilestone) {
      router.push({
        pathname: "/company/stamp-card-template/reward",
        params: { next: "stampSummary", ...baseParams },
      });
      return;
    }

    if (baseParams) {
      router.push({
        pathname: "/company/stamp-card-template/reward",
        params: baseParams,
      });
      return;
    }

    router.push("/company/stamp-card-template/reward");
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#1A4196" />
      </View>
    );
  }

  if (rewards.length === 0) {
    return null;
  }

  return (
    <RewardPicker
      rewards={rewards}
      onSelect={handleSelect}
      onNext={handleNext}
      canGoNext={Boolean(selectedReward)}
      selectedRewardId={selectedReward?.id}
      onCreateNew={handleCreateNew}
      onBack={() => router.back()}
      title={
        isForMilestone
          ? t("Loyalty.selectMilestoneReward")
          : t("Loyalty.selectReward")
      }
      refreshing={refreshing}
      onRefresh={onRefresh}
    />
  );
}
