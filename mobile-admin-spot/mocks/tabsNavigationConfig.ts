import type { TabsNavigationConfig } from "@/components/organisms/StandardTabsLayout/types";

export const DEFAULT_TABS_CONFIG: TabsNavigationConfig = {
  tabs: [
    {
      name: "index",
      labelKey: "Company.yourCompany",
      icon: "company",
      order: 0,
      variant: "standard",
    },
    {
      name: "order-queue",
      labelKey: "TabBar.orderQueueShort",
      icon: "orderQueue",
      order: 1,
      variant: "standard",
    },
    {
      name: "qr",
      labelKey: "Company.scanQR",
      icon: "qr",
      order: 2,
      variant: "highlighted",
    },
    {
      name: "profile",
      labelKey: "Company.yourAccount",
      icon: "profile",
      order: 3,
      variant: "standard",
    },
  ],
};

export const MOCK_TABS_NAVIGATION_CONFIG: TabsNavigationConfig =
  DEFAULT_TABS_CONFIG;
