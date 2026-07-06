import { StandardTabsLayout } from "@/components/organisms/StandardTabsLayout";
import { colors } from "@/constants/colors";
import { useTabsConfig } from "@/hooks/useTabsConfig";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";
import { useTranslation } from "react-i18next";
import { DynamicColorIOS, Platform } from "react-native";
import {getSfIcon} from "@/components/organisms/StandardTabsLayout/utils";

export default function TabsLayout() {
    const { t } = useTranslation();
    const { config } = useTabsConfig();

    if (isLiquidGlassAvailable()) {
        const tintColor = colors.tabBar.primary;

        const labelSelectedStyle =
            Platform.OS === "ios" ? { color: tintColor } : undefined;

        return (
            <NativeTabs
                labelStyle={{
                    color: DynamicColorIOS({
                        light: "#000000",
                        dark: "#FFFFFF",
                    }),
                }}
                tintColor={tintColor}
                indicatorColor={tintColor + "25"}
                disableTransparentOnScrollEdge
            >
                {config.tabs.map((tab) => (
                    <NativeTabs.Trigger key={tab.name} name={tab.name}>
                        <Icon
                            sf={getSfIcon(tab.icon)}
                            selectedColor={tintColor}
                        />
                        <Label selectedStyle={labelSelectedStyle}>
                            {t(tab.labelKey)}
                        </Label>
                    </NativeTabs.Trigger>
                ))}
            </NativeTabs>
        );
    }

    return <StandardTabsLayout config={config} />;
}
