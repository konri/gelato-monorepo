import { TabScreenWrapper } from "@/components/TabScreenWrapper";
import { Slot } from "expo-router";
import React from "react";

export default function OrderQueueTabLayout() {
  return (
    <TabScreenWrapper
      showHeader
      noPadding
      withTabBarInset={false}
      omitSafeAreaBottom
    >
      <Slot />
    </TabScreenWrapper>
  );
}
