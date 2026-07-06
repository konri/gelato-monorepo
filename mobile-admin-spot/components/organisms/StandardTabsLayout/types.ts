type TabVariant = "standard" | "highlighted";

type TabIconName = "company" | "orderQueue" | "qr" | "profile";

type TabConfig = {
  name: string;
  labelKey: string;
  icon: TabIconName;
  order: number;
  variant: TabVariant;
};

type TabsNavigationConfig = {
  tabs: TabConfig[];
};

type StandardTabsLayoutProps = {
  config?: TabsNavigationConfig;
};

export type {
  StandardTabsLayoutProps,
  TabConfig,
  TabIconName,
  TabVariant,
  TabsNavigationConfig,
};
