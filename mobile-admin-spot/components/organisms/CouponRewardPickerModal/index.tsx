import { Typography } from "@/components/atoms/Typography";
import { MerchantRewardCard } from "@/components/molecules/MerchantRewardCard";
import { BottomSheetModal } from "@/components/molecules/Modal";
import { ActionButtons } from "@/components/organisms/MultiStepForm/ActionButtons";
import { useGetMyRewards } from "@/hooks/graphql/queries/useGetMyRewards";
import type { Reward } from "@/shared/api-client/src/graphql/queries/myRewards/types";
import type { BottomSheetFooterProps } from "@gorhom/bottom-sheet";
import { BottomSheetFlatList, BottomSheetFooter } from "@gorhom/bottom-sheet";
import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, View } from "react-native";
import type { CouponRewardPickerModalProps } from "./types";

type RewardListItem =
  | { id: string; kind: "add" }
  | { id: string; kind: "reward"; reward: Reward };

export const CouponRewardPickerModal = ({
  visible,
  selectedRewardId,
  onClose,
  onSave,
  onCreateNew,
}: CouponRewardPickerModalProps) => {
  const { t } = useTranslation();
  const { rewards, loading: isLoading } = useGetMyRewards({ skip: !visible });
  const [pendingRewardId, setPendingRewardId] = useState<string | undefined>(
    selectedRewardId,
  );

  useEffect(() => {
    if (visible) {
      setPendingRewardId(selectedRewardId);
    }
  }, [visible, selectedRewardId]);

  const rewardItems = useMemo<RewardListItem[]>(() => {
    const items: RewardListItem[] = [
      { id: "add-reward-card", kind: "add" },
      ...rewards.map((reward) => ({
        id: reward.id,
        kind: "reward" as const,
        reward,
      })),
    ];
    return items;
  }, [rewards]);

  const handleSave = useCallback(() => {
    if (!pendingRewardId) {
      return;
    }

    const selectedRewardTitle = rewards.find((reward) => reward.id === pendingRewardId)?.title;
    onSave(pendingRewardId, selectedRewardTitle);
    onClose();
  }, [onClose, onSave, pendingRewardId, rewards]);

  const renderFooter = useCallback(
    (props: BottomSheetFooterProps) => (
      <BottomSheetFooter {...props} style={{ pointerEvents: "auto" }}>
        <View className="px-6 py-4 bg-gray-50 border-t border-gray-100">
          <ActionButtons
            onCancel={onClose}
            onSubmit={handleSave}
            cancelButtonText={t("Common.cancel")}
            submitButtonText={t("Common.save")}
            canSubmit={Boolean(pendingRewardId)}
          />
        </View>
      </BottomSheetFooter>
    ),
    [handleSave, onClose, pendingRewardId, t],
  );

  return (
    <BottomSheetModal
      visible={visible}
      onClose={onClose}
      title={t("Coupon.selectReward")}
      snapPoints={["80%"]}
      enableDynamicSizing={false}
      footerComponent={renderFooter}
    >
      <BottomSheetFlatList<RewardListItem>
        data={isLoading || rewards.length === 0 ? [] : rewardItems}
        numColumns={2}
        keyExtractor={(item: RewardListItem) => item.id}
        columnWrapperStyle={{ justifyContent: "space-between" }}
        renderItem={({ item }: { item: RewardListItem }) => (
          <View className="w-[48%] mb-2.5">
            {item.kind === "add" ? (
              <MerchantRewardCard
                variant="add"
                title={t("Loyalty.createNew")}
                onPress={onCreateNew}
              />
            ) : (
              <MerchantRewardCard
                variant="reward"
                title={item.reward.title}
                imageUrl={item.reward.imageUrl}
                logoUrl={item.reward.merchant?.logoUrl ?? undefined}
                onPress={() => setPendingRewardId(item.reward.id)}
                disabled={!item.reward.isActive}
                selected={item.reward.id === pendingRewardId}
              />
            )}
          </View>
        )}
        ListEmptyComponent={
          isLoading ? (
            <View className="py-8 items-center justify-center">
              <ActivityIndicator size="small" color="#1A4196" />
            </View>
          ) : (
            <Typography
              variant="text-14-regular-spaced"
              className="text-black-47"
            >
              {t("Coupon.rewardPickerEmpty")}
            </Typography>
          )
        }
        style={{ flex: 1 }}
        focusHook={useFocusEffect}
        enableFooterMarginAdjustment
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 16 }}
      />
    </BottomSheetModal>
  );
};
