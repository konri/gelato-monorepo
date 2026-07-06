import { KeyboardAwareScrollView } from "@/components/KeyboardAwareScrollView";
import { ChangePasswordForm } from "@/components/molecules/ChangePasswordForm";
import { ProfileTabScreenShell } from "@/components/molecules/ProfileTabScreenShell";
import { TechnicalScreenTitleRow } from "@/components/molecules/TechnicalScreenTitleRow";
import { useTabBarScrollBottomInset } from "@/hooks/useTabBarInset";
import React from "react";
import { useTranslation } from "react-i18next";

export default function ChangePasswordScreen() {
  const { t } = useTranslation();
  const scrollBottomInset = useTabBarScrollBottomInset();

  return (
    <ProfileTabScreenShell>
      <KeyboardAwareScrollView
        className="flex-1 bg-gray-50-light"
        contentContainerClassName="flex-grow-1 p-6 gap-4"
        contentContainerStyle={{ paddingBottom: scrollBottomInset }}
        showsVerticalScrollIndicator={false}
      >
        <TechnicalScreenTitleRow
          title={t("AccountHub.changePasswordScreenTitle")}
        />
        <ChangePasswordForm />
      </KeyboardAwareScrollView>
    </ProfileTabScreenShell>
  );
}
