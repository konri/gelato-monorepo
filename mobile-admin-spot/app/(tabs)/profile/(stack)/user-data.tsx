import { Button } from "@/components/atoms/Button";
import { ProfileStackScrollScreen } from "@/components/molecules/ProfileStackScrollScreen";
import { ProfileTabScreenShell } from "@/components/molecules/ProfileTabScreenShell";
import { TechnicalScreenTitleRow } from "@/components/molecules/TechnicalScreenTitleRow";
import { AccountUserDataReadOnlyCard } from "@/components/organisms/AccountUserDataReadOnlyCard";
import { useGetMyMerchants } from "@/hooks/graphql/queries/useGetMyMerchants";
import { useWhoAmI } from "@/hooks/graphql/queries/useWhoAmI";
import { getDistinctUserRoleLabels } from "@/utils/getUserRoleLabels";
import { router } from "expo-router";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, View } from "react-native";

export default function UserDataScreen() {
  const { t } = useTranslation();
  const { data: whoData, loading: whoLoading } = useWhoAmI();
  const { data: merchantsData } = useGetMyMerchants();

  const user = whoData?.whoAmI;
  const merchants = merchantsData?.myMerchants ?? [];

  const roleLabels = useMemo(
    () => getDistinctUserRoleLabels(user?.roles, t),
    [user?.roles, t],
  );

  if (whoLoading && !user) {
    return (
      <ProfileTabScreenShell>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator />
        </View>
      </ProfileTabScreenShell>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <ProfileStackScrollScreen>
      <TechnicalScreenTitleRow
        title={t("AccountHub.userDataTitle")}
        rightAccessory={
          <View className="shrink-0">
            <Button
              title={t("AccountHub.editProfileCta")}
              onPress={() => router.push("/profile/edit-profile")}
              variant="outlineSecondary"
              size="sm"
              width="auto"
              height={40}
              className="px-4"
            />
          </View>
        }
      />
      <AccountUserDataReadOnlyCard
        user={user}
        merchants={merchants}
        roleLabels={roleLabels}
      />
    </ProfileStackScrollScreen>
  );
}
