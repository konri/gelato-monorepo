import { colors } from "@/constants/colors";
import { getTabBarStyle } from "@/constants/tabBarStyles";
import { useTabsConfig } from "@/hooks/useTabsConfig";
import type { BottomTabNavigationOptions } from "@react-navigation/bottom-tabs";
import { Tabs } from "expo-router";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { HighlightedTabButton } from "./HighlightedTabButton";
import { TabLabel } from "./TabLabel";
import type { StandardTabsLayoutProps } from "./types";
import { getTabIcon } from "./utils";

const STANDARD_TAB_ITEM_STYLE = { paddingTop: 4 } as const;

const TabBarBackground = () => (
    <View style={{ flex: 1, backgroundColor: colors.tabBar.background }} />
);

export const StandardTabsLayout = ({
                                       config: externalConfig,
                                   }: StandardTabsLayoutProps = {}) => {
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();
    const { config: fetchedConfig } = useTabsConfig(!externalConfig);

    const config = externalConfig ?? fetchedConfig;
    const tabBarStyle = useMemo(
        () => getTabBarStyle(insets.bottom),
        [insets.bottom],
    );

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
        <View style={{ flex: 1, backgroundColor: colors.tabBar.background }}>
            <Tabs
                screenOptions={{
                    headerShown: false,
                    tabBarStyle,
                    tabBarActiveTintColor: colors.tabBar.primary,
                    tabBarInactiveTintColor: colors.tabBar.text,
                    tabBarBackground: TabBarBackground,
                    tabBarSafeAreaInsets: { bottom: 0 },
                    sceneContainerStyle: { backgroundColor: colors.tabBar.background },
                }}
            >
                {config.tabs.map((tab) => (
                    <Tabs.Screen
                        key={tab.name}
                        name={tab.name}
                        options={getOptionsForTab(tab.name)}
                    />
                ))}
            </Tabs>
        </View>
    );
};
