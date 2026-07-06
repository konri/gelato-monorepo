import { Typography } from "@/components/atoms/Typography";
import { RewardGrid } from "@/components/molecules/RewardGrid";
import { ActionButtons } from "@/components/organisms/MultiStepForm/ActionButtons";
import React from "react";
import { useTranslation } from "react-i18next";
import { RefreshControl, ScrollView, View } from "react-native";
import type { RewardPickerProps } from "./types";

export const RewardPicker = ({
  rewards,
  onSelect,
  onCreateNew,
  onBack,
  onNext,
  canGoNext,
  selectedRewardId,
  title,
  subtitle,
  refreshing = false,
  onRefresh,
}: RewardPickerProps) => {
  const { t } = useTranslation();

  const displayTitle = title ?? t("Loyalty.selectReward");
  const displaySubtitle = subtitle ?? t("Loyalty.selectRewardSubtitle");

  return (
    <View className="flex-1 bg-gray-50-light">
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-6 pt-6 pb-4 gap-4"
        showsVerticalScrollIndicator={false}
        refreshControl={
          onRefresh ? (
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          ) : undefined
        }
      >
        <View className="gap-1">
          <Typography variant="text-20-bold" className="text-black">
            {displayTitle}
          </Typography>
          <Typography
            variant="text-14-regular-spaced"
            className="text-gray-600"
          >
            {displaySubtitle}
          </Typography>
        </View>

        <RewardGrid
          rewards={rewards}
          onSelect={onSelect}
          selectedRewardId={selectedRewardId}
          disableInactiveRewards
          showAddCard
          addCardTitle={t("Loyalty.createNew")}
          onCreateNew={onCreateNew}
        />

        <ActionButtons
          onCancel={onBack}
          onSubmit={onNext}
          cancelButtonText={t("Common.back")}
          submitButtonText={t("Common.next")}
          canSubmit={canGoNext}
        />
      </ScrollView>
    </View>
  );
};
