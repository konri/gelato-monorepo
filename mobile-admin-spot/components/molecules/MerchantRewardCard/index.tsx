import { DeleteButton } from "@/components/molecules/DeleteButton";
import { RewardCard } from "@/components/molecules/RewardCard";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, View } from "react-native";
import type { MerchantRewardCardProps } from "./types";

const AddRewardPlaceholder = () => (
  <View className="w-full h-full items-center justify-center bg-white">
    <View className="w-12 h-12 rounded-full bg-gray-50-light items-center justify-center">
      <Ionicons name="add" size={24} color="#000000" />
    </View>
  </View>
);

export const MerchantRewardCard = ({
  variant,
  title,
  stampsRequired,
  imageUrl,
  logoUrl,
  stampsLabel,
  onPress,
  onDelete,
  disabled = false,
  selected = false,
}: MerchantRewardCardProps) => {
  if (variant === "add") {
    return (
      <Pressable onPress={onPress} className="flex-1">
        <RewardCard
          title={title ?? ""}
          cost={0}
          stampsLabel=""
          imageContent={<AddRewardPlaceholder />}
        />
      </Pressable>
    );
  }

  return (
    <Pressable onPress={onPress} className="flex-1" disabled={disabled}>
      <View className="relative">
        <View className={disabled ? "opacity-50" : undefined}>
          <RewardCard
            title={title ?? ""}
            cost={stampsRequired ?? 0}
            stampsLabel={stampsLabel ?? ""}
            imageUrl={imageUrl ?? undefined}
            logoUrl={logoUrl ?? undefined}
            containerClassName={selected ? "border-blue-900" : undefined}
          />
        </View>
        {onDelete && (
          <View className="absolute top-2 right-2">
            <DeleteButton onPress={onDelete} />
          </View>
        )}
      </View>
    </Pressable>
  );
};
