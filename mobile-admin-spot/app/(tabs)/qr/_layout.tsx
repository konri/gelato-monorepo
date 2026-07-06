import { TabScreenWrapper } from "@/components/TabScreenWrapper";
import { Slot } from "expo-router";
import React from "react";

export default function QrTabLayout() {
  return (
    <TabScreenWrapper showHeader withTabBarInset={false}>
      <Slot />
    </TabScreenWrapper>
  );
}
