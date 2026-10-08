import { StandardTabsLayout } from "@/components/organisms/StandardTabsLayout";
import { getSfIcon } from "@/components/organisms/StandardTabsLayout/utils";
import { colors } from "@/constants/colors";
import { PALETTE } from "@/constants/palette";
import { useAuthState } from "@/hooks/useAuthState";
import { useNotificationRegistration } from "@/hooks/useNotificationRegistration";
import { usePointsSubscription } from "@/hooks/usePointsSubscription";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import { Redirect } from "expo-router";
import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";
import { useTranslation } from "react-i18next";
import { DynamicColorIOS, Platform } from "react-native";

const TABS = [
  { name: "index", labelKey: "Tabs.start", icon: "home" },
  { name: "tastes", labelKey: "Tabs.tastes", icon: "icecream" },
  { name: "ordering", labelKey: "Tabs.ordering", icon: "cart" },
  { name: "prizes", labelKey: "Tabs.prizes", icon: "award" },
  { name: "spots", labelKey: "Tabs.spots", icon: "map" },
] as const;

export default function TabsLayout() {
  const { t } = useTranslation();
  const { isLoggedIn, isLoading } = useAuthState();

  useNotificationRegistration();
  usePointsSubscription(isLoggedIn);

  // NativeTabs must stay mounted. Returning a spinner here leaves tab screens
  // without a navigator and they throw "Couldn't find a navigation context".
  if (!isLoading && !isLoggedIn) {
    return <Redirect href="/welcome" />;
  }

  if (isLiquidGlassAvailable()) {
    const tintColor = colors.tabBar.primary;
    const labelSelectedStyle =
      Platform.OS === "ios" ? { color: tintColor } : undefined;

    return (
      <NativeTabs
        labelStyle={{
          color: DynamicColorIOS({
            light: PALETTE.espresso,
            dark: "#FFFFFF",
          }),
        }}
        tintColor={tintColor}
        indicatorColor={`${tintColor}25`}
        disableTransparentOnScrollEdge
      >
        {TABS.map((tab) => (
          <NativeTabs.Trigger key={tab.name} name={tab.name}>
            <Icon sf={getSfIcon(tab.icon)} selectedColor={tintColor} />
            <Label selectedStyle={labelSelectedStyle}>{t(tab.labelKey)}</Label>
          </NativeTabs.Trigger>
        ))}
      </NativeTabs>
    );
  }

  return <StandardTabsLayout />;
}
