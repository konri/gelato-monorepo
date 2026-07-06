import { TabScreenWrapper } from "@/components/TabScreenWrapper";
import { Slot } from "expo-router";
import React from "react";

export default function IndexTabLayout() {
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
