import type { TabsNavigationConfig } from "@/components/organisms/StandardTabsLayout/types";

export const DEFAULT_TABS_CONFIG: TabsNavigationConfig = {
  tabs: [
    {
      name: "index",
      labelKey: "Tabs.start",
      icon: "home",
      order: 0,
      variant: "standard",
    },
    {
      name: "tastes",
      labelKey: "Tabs.tastes",
      icon: "icecream",
      order: 1,
      variant: "standard",
    },
    {
      name: "ordering",
      labelKey: "Tabs.ordering",
      icon: "cart",
      order: 2,
      variant: "standard",
    },
    {
      name: "prizes",
      labelKey: "Tabs.prizes",
      icon: "award",
      order: 3,
      variant: "standard",
    },
    {
      name: "spots",
      labelKey: "Tabs.spots",
      icon: "map",
      order: 4,
      variant: "standard",
    },
  ],
};

export const MOCK_TABS_NAVIGATION_CONFIG: TabsNavigationConfig =
  DEFAULT_TABS_CONFIG;
