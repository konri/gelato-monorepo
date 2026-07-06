import { CustomSafeAreaView } from "@/components/CustomSafeAreaView";
import { HeaderWithBackButton } from "@/components/HeaderWithBackButton";
import React from "react";
import { ScrollView } from "react-native";
import { router } from "expo-router";
import { t } from "i18next";
import { Typography } from "@/components/atoms/Typography";
import { YourAccount } from "@/components/molecules/Settings/YourAccount";
import { SettingsItems } from "@/components/molecules/Settings/SettingsItems";

export default function settingsScreen() {
    return (
        <CustomSafeAreaView>
            <HeaderWithBackButton
                title={t('Settings.title')}
                variant="card"
            />
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
                <Typography variant="body-lg-bold" className="my-4 px-6">
                    {t('Settings.subtitle')}
                </Typography>
                <YourAccount onPress={() => router.push('/settings/edit-profile')} />
                <SettingsItems />
            </ScrollView>
        </CustomSafeAreaView>
    )
}
