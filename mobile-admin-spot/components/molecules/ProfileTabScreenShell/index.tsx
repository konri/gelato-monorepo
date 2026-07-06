import { TabScreenWrapper } from "@/components/TabScreenWrapper";
import React from "react";
import type { ProfileTabScreenShellProps } from "./types";

export const ProfileTabScreenShell = ({
  children,
  showBackButton = true,
}: ProfileTabScreenShellProps) => (
  <TabScreenWrapper
    showHeader
    showBackButton={showBackButton}
    noPadding
    withTabBarInset={false}
    omitSafeAreaBottom
  >
    {children}
  </TabScreenWrapper>
);
