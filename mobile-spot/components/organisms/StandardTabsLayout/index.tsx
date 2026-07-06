import { colors } from "@/constants/colors";
import { TAB_BAR_STYLE } from "@/constants/tabBarStyles";
import { useTabsConfig } from "@/hooks/useTabsConfig";
import type { BottomTabNavigationOptions } from "@react-navigation/bottom-tabs";
import { Tabs } from "expo-router";
import { useTranslation } from "react-i18next";
import { HighlightedTabButton } from "./HighlightedTabButton";
import { TabLabel } from "./TabLabel";
import type { StandardTabsLayoutProps } from "./types";
import { getTabIcon } from "./utils";

const STANDARD_TAB_ITEM_STYLE = { paddingTop: 4 } as const;

const SCREEN_OPTIONS = {
    headerShown: false,
    tabBarStyle: TAB_BAR_STYLE,
    tabBarActiveTintColor: colors.tabBar.primary,
    tabBarInactiveTintColor: colors.tabBar.text,
} as const;

const TAB_NAMES = ["index", "qr", "profile"] as const;

export const StandardTabsLayout = ({
                                       config: externalConfig,
                                   }: StandardTabsLayoutProps = {}) => {
    const { t } = useTranslation();
    const { config: fetchedConfig } = useTabsConfig(!externalConfig);

    const config = externalConfig ?? fetchedConfig;

    const getOptionsForTab = (
        tabName: string
    ): BottomTabNavigationOptions => {
        const tab = config.tabs.find((tab) => tab.name === tabName);
        if (!tab) return {};

        const IconComponent = getTabIcon(tab.icon);
        const label = t(tab.labelKey);

        const baseOptions: BottomTabNavigationOptions = {
            tabBarIcon: ({ color, size }) => (
                <IconComponent color={color} size={size} />
            ),
            tabBarLabel: ({ focused, color }) => (
                <TabLabel
                    label={label}
                    focused={focused}
                    color={color as string}
                />
            ),
        };

        if (tab.variant === "highlighted") {
            return {
                ...baseOptions,
                tabBarButton: ({
                                   children,
                                   onPress,
                                   accessibilityState,
                               }) => (
                    <HighlightedTabButton
                        onPress={onPress}
                        accessibilityState={accessibilityState}
                        enabled={true}
                    >
                        {children}
                    </HighlightedTabButton>
                ),
            };
        }

        return {
            ...baseOptions,
            tabBarItemStyle: STANDARD_TAB_ITEM_STYLE,
        };
    };

    return (
        <Tabs screenOptions={SCREEN_OPTIONS}>
            {config.tabs.map((tab) => (
                <Tabs.Screen
                    key={tab.name}
                    name={tab.name}
                    options={getOptionsForTab(tab.name)}
                />
            ))}
        </Tabs>
    );
};