import { MerchantRewardCard } from "@/components/molecules/MerchantRewardCard";
import { Typography } from "@/components/atoms/Typography";
import type { Reward } from "@/shared/api-client/src/graphql/queries/myRewards";
import React from "react";
import { View } from "react-native";
import type { RewardGridProps } from "./types";

export const RewardGrid = ({
  rewards,
  onSelect,
  onDelete,
  getItemKey,
  showAddCard,
  addCardTitle,
  onCreateNew,
  disableInactiveRewards = false,
  selectedRewardId,
  getScopeLabel,
}: RewardGridProps) => {
  return (
    <View className="flex-row flex-wrap gap-2.5">
      {showAddCard && (
        <View className="w-[48%]">
          <MerchantRewardCard
            variant="add"
            title={addCardTitle ?? ""}
            onPress={onCreateNew}
          />
        </View>
      )}
      {rewards.map((item: Reward, index: number) => (
        <View
          key={getItemKey ? getItemKey(item, index) : `${item.id ?? "reward"}-${index}`}
          className="w-[48%]"
        >
          <MerchantRewardCard
            variant="reward"
            title={item.title}
            imageUrl={item.imageUrl}
            logoUrl={item.merchant?.logoUrl ?? undefined}
            onPress={() => onSelect(item)}
            onDelete={onDelete ? () => onDelete(item) : undefined}
            disabled={disableInactiveRewards && !item.isActive}
            selected={item.id === selectedRewardId}
          />
          {getScopeLabel?.(item) ? (
            <Typography variant="text-12-regular" className="text-gray-600 mt-1">
              {getScopeLabel(item)}
            </Typography>
          ) : null}
        </View>
      ))}
    </View>
  );
};
