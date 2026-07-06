import { TAB_BAR_TOTAL_HEIGHT } from "@/constants/tabBarStyles";
import { BottomTabBarHeightContext } from "@react-navigation/bottom-tabs";
import * as React from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const TAB_CONTENT_GAP = 16;
const TAB_SCROLL_END_GAP = 6;
const NATIVE_TAB_BAR_BODY_ESTIMATE = 54;

const minTabBarClearance = TAB_BAR_TOTAL_HEIGHT + TAB_CONTENT_GAP;

export const useTabBarInset = (): number => {
  const measuredTabBarHeight = React.useContext(BottomTabBarHeightContext);

  if (measuredTabBarHeight !== undefined && measuredTabBarHeight > 0) {
    return Math.max(minTabBarClearance, measuredTabBarHeight + TAB_CONTENT_GAP);
  }

  return minTabBarClearance;
};

export const useTabBarScrollBottomInset = (): number => {
  const measuredTabBarHeight = React.useContext(BottomTabBarHeightContext);
  const insets = useSafeAreaInsets();

  const fallback = Math.max(
    TAB_BAR_TOTAL_HEIGHT + TAB_SCROLL_END_GAP,
    insets.bottom + NATIVE_TAB_BAR_BODY_ESTIMATE + TAB_SCROLL_END_GAP
  );

  if (measuredTabBarHeight !== undefined && measuredTabBarHeight > 0) {
    return Math.max(
      fallback,
      measuredTabBarHeight + TAB_SCROLL_END_GAP
    );
  }

  return fallback;
};
