import { KeyboardAwareScrollView } from "@/components/KeyboardAwareScrollView";
import { SignUpDetailsForm } from "@/components/molecules/SignUpDetailsForm";
import { ProfileTabScreenShell } from "@/components/molecules/ProfileTabScreenShell";
import { TechnicalScreenTitleRow } from "@/components/molecules/TechnicalScreenTitleRow";
import { useEditProfileScreen } from "@/hooks/useEditProfileScreen";
import { useTabBarScrollBottomInset } from "@/hooks/useTabBarInset";
import { router } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, View } from "react-native";

export default function EditProfileScreen() {
  const { t } = useTranslation();
  const scrollBottomInset = useTabBarScrollBottomInset();
  const { whoLoading, user, accountDefaults } = useEditProfileScreen();

  if (whoLoading && !user) {
    return (
      <ProfileTabScreenShell>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator />
        </View>
      </ProfileTabScreenShell>
    );
  }

  return (
    <ProfileTabScreenShell>
      <KeyboardAwareScrollView
        className="flex-1 bg-gray-50-light"
        contentContainerClassName="flex-grow-1 p-6 gap-4"
        contentContainerStyle={{ paddingBottom: scrollBottomInset }}
        showsVerticalScrollIndicator={false}
      >
        <TechnicalScreenTitleRow title={t("AccountHub.editProfileTitle")} />
        <SignUpDetailsForm
          remoteUri={user?.picture}
          defaultValues={accountDefaults}
          onSuccess={() => router.back()}
        />
      </KeyboardAwareScrollView>
    </ProfileTabScreenShell>
  );
}
