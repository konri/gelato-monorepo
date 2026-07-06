import { Image } from "@/components/atoms/Image";
import { Typography } from "@/components/atoms/Typography";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, View } from "react-native";

import type { StoreCardProps } from "./types";

export const StoreCard = ({ store, onPress }: StoreCardProps) => {
  return (
    <Pressable
      onPress={onPress}
      className="bg-white rounded-2xl p-2 flex-row gap-3 shadow-sm"
    >
      <View className="w-32 h-20 rounded-lg overflow-hidden">
        <Image
          uri={store.photoUrl}
          className="w-full h-full"
          fallbackLogoSize={24}
          contentFit="cover"
        />
      </View>

      <View className="flex-1 justify-between gap-1">
        <View className="bg-gray-100 self-start rounded-full px-2 h-5.5 justify-center">
          <Typography variant="text-12-bold" className="text-gray-650">
            {store.city}
          </Typography>
        </View>

        <View className="gap-1">
          <Typography variant="text-12-bold" className="text-black">
            {store.name}
          </Typography>
          <Typography variant="text-12-bold" className="text-black">
            {store.address}
          </Typography>
          <Typography variant="text-12-regular" className="text-gray-650">
            {store.city}
          </Typography>
        </View>

        {store.phone ? (
          <View className="flex-row items-center gap-1.5">
            <Ionicons name="call-outline" size={15} color="#1A4196" />
            <Typography variant="text-12-regular" className="text-blue-900">
              {store.phone}
            </Typography>
          </View>
        ) : null}
      </View>

      <View className="justify-center self-stretch">
        <Ionicons name="chevron-forward" size={14} color="#000000" />
      </View>
    </Pressable>
  );
};
