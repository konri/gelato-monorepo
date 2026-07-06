import {
  CompanyTabIcon,
  OrderQueueTabIcon,
  ProfileTabIcon,
  QrTabIcon,
} from "@/components/atoms/TabBarIcons";
import type { TabBarIconProps } from "@/components/atoms/TabBarIcons/types";
import type { SFSymbol } from "sf-symbols-typescript";
import type { TabIconName } from "./types";

type TabIconComponent = (props: TabBarIconProps) => React.JSX.Element;

type SfIconConfig = SFSymbol | { default: SFSymbol; selected: SFSymbol };

const TAB_ICON_MAP: Record<TabIconName, TabIconComponent> = {
  company: CompanyTabIcon,
  orderQueue: OrderQueueTabIcon,
  qr: QrTabIcon,
  profile: ProfileTabIcon,
};

const SF_ICON_MAP: Record<TabIconName, SfIconConfig> = {
  company: { default: "storefront", selected: "storefront.fill" },
  orderQueue: {
    default: "list.bullet.rectangle",
    selected: "list.bullet.rectangle.fill",
  },
  qr: "qrcode.viewfinder",
  profile: {
    default: "person.crop.circle",
    selected: "person.crop.circle.fill",
  },
};

export const getTabIcon = (iconName: TabIconName): TabIconComponent =>
  TAB_ICON_MAP[iconName];

export const getSfIcon = (iconName: TabIconName): SfIconConfig =>
  SF_ICON_MAP[iconName];
