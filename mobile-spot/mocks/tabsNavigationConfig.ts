import type { TabsNavigationConfig } from "@/components/organisms/StandardTabsLayout/types";

// Spot app tabs (Phase 1): live Orders queue, today's Prepared list, Profile.
export const DEFAULT_TABS_CONFIG: TabsNavigationConfig = {
  tabs: [
    {
      name: "index",
      labelKey: "SpotTabs.orders",
      icon: "cart",
      order: 0,
      variant: "standard",
    },
    {
      name: "prepared",
      labelKey: "SpotTabs.prepared",
      icon: "qr",
      order: 1,
      variant: "standard",
    },
    {
      name: "profile",
      labelKey: "SpotTabs.profile",
      icon: "profile",
      order: 2,
      variant: "standard",
    },
  ],
};

export const MOCK_TABS_NAVIGATION_CONFIG: TabsNavigationConfig =
  DEFAULT_TABS_CONFIG;
