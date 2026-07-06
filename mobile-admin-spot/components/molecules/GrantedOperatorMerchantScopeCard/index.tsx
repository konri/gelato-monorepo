import { Typography } from "@/components/atoms/Typography";
import { OperatorPermissionMatrixReadOnly } from "@/components/molecules/OperatorPermissionMatrixReadOnly";
import { OperatorStoreScopePanel } from "@/components/molecules/OperatorStoreScopePanel";
import { SettingsSectionCard } from "@/components/molecules/SettingsSectionCard";
import { SCOPE_MODE_LABEL_KEYS } from "@/constants/operatorPermissions";
import React from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import type { GrantedOperatorMerchantScopeCardProps } from "./types";

export const GrantedOperatorMerchantScopeCard = ({
  merchantName,
  scope,
  storeNames,
}: GrantedOperatorMerchantScopeCardProps) => {
  const { t } = useTranslation();
  const scopeLabel = t(SCOPE_MODE_LABEL_KEYS[scope.scopeMode]);
  const ec = scope.editCapabilities;

  return (
    <SettingsSectionCard>
      <View className="p-4 gap-4">
        <View className="gap-1">
          <Typography variant="text-16-bold" className="text-dark">
            {merchantName}
          </Typography>
          <Typography variant="text-12-regular" className="text-cool-gray">
            {t("Cooperators.scopeValue", { scope: scopeLabel })}
          </Typography>
          <Typography variant="text-12-regular" className="text-cool-gray">
            {t("LoyaltyConfig.merchantWideCapability")}:{" "}
            {ec.canEditMerchantBaseConfig
              ? t("LoyaltyConfig.allowed")
              : t("LoyaltyConfig.notAllowed")}
          </Typography>
          <Typography variant="text-12-regular" className="text-cool-gray">
            {t("LoyaltyConfig.storeOverrideCouponsCapability")}:{" "}
            {ec.canEditCouponStoreOverrides
              ? t("LoyaltyConfig.allowed")
              : t("LoyaltyConfig.notAllowed")}
          </Typography>
          <Typography variant="text-12-regular" className="text-cool-gray">
            {t("LoyaltyConfig.storeOverrideRewardsCapability")}:{" "}
            {ec.canEditRewardStoreOverrides
              ? t("LoyaltyConfig.allowed")
              : t("LoyaltyConfig.notAllowed")}
          </Typography>
          <Typography variant="text-12-regular" className="text-cool-gray">
            {t("LoyaltyConfig.storeOverrideStreaksCapability")}:{" "}
            {ec.canEditStreakStoreOverrides
              ? t("LoyaltyConfig.allowed")
              : t("LoyaltyConfig.notAllowed")}
          </Typography>
        </View>

        <OperatorPermissionMatrixReadOnly permissions={scope.permissions} />

        <View className="h-px bg-gray-lighter" />

        <OperatorStoreScopePanel
          mode="readOnly"
          storeScopeAll={scope.storeScopeAll}
          storeNames={storeNames}
        />
      </View>
    </SettingsSectionCard>
  );
};
