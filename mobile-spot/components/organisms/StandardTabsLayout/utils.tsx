import {
  HomeTabIcon, MerchantsTabIcon, AwardTabIcon,
  ProfileTabIcon,
  QrTabIcon,
  IcecreamTabIcon,
  CartTabIcon,
  MapTabIcon,
} from "@/components/atoms/TabBarIcons";
import type { TabBarIconProps } from "@/components/atoms/TabBarIcons/types";
import type { SFSymbol } from "sf-symbols-typescript";
import type { TabIconName } from "./types";

type TabIconComponent = (props: TabBarIconProps) => React.JSX.Element;

type SfIconConfig = SFSymbol | { default: SFSymbol; selected: SFSymbol };

const TAB_ICON_MAP: Record<TabIconName, TabIconComponent> = {
  home: HomeTabIcon,
  merchants: MerchantsTabIcon,
  qr: QrTabIcon,
  award: AwardTabIcon,
  profile: ProfileTabIcon,
  icecream: IcecreamTabIcon,
  cart: CartTabIcon,
  map: MapTabIcon,
};

const SF_ICON_MAP: Record<TabIconName, SfIconConfig> = {
  home: { default: "house", selected: "house.fill" },
  merchants: { default: "storefront", selected: "storefront.fill" },
  qr: "qrcode.viewfinder",
  award: { default: "star", selected: "star.fill" },
  profile: {
    default: "person.crop.circle",
    selected: "person.crop.circle.fill",
  },
  icecream: { default: "circle", selected: "circle.fill" },
  cart: { default: "cart", selected: "cart.fill" },
  map: { default: "map", selected: "map.fill" },
};

export const getTabIcon = (iconName: TabIconName): TabIconComponent =>
    TAB_ICON_MAP[iconName];

export const getSfIcon = (iconName: TabIconName): SfIconConfig =>
    SF_ICON_MAP[iconName];
