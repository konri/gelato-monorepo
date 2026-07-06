import type { TabsNavigationConfig } from "@/components/organisms/StandardTabsLayout/types";

// Courier app tabs: Home (job on/off + active delivery), Deliveries history, Earnings.
export const DEFAULT_TABS_CONFIG: TabsNavigationConfig = {
  tabs: [
    {
      name: "index",
      labelKey: "CourierTabs.home",
      icon: "home",
      order: 0,
      variant: "standard",
    },
    {
      name: "deliveries",
      labelKey: "CourierTabs.deliveries",
      icon: "cart",
      order: 1,
      variant: "standard",
    },
    {
      name: "earnings",
      labelKey: "CourierTabs.earnings",
      icon: "award",
      order: 2,
      variant: "standard",
    },
  ],
};

export const MOCK_TABS_NAVIGATION_CONFIG: TabsNavigationConfig =
  DEFAULT_TABS_CONFIG;
