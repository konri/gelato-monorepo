import { Typography } from "@/components/atoms/Typography";
import { GrantedOperatorMerchantScopeCard } from "@/components/molecules/GrantedOperatorMerchantScopeCard";
import { ProfileStackScrollScreen } from "@/components/molecules/ProfileStackScrollScreen";
import { SettingsSectionCard } from "@/components/molecules/SettingsSectionCard";
import { SettingsSectionHeading } from "@/components/molecules/SettingsSectionHeading";
import { TechnicalScreenTitleRow } from "@/components/molecules/TechnicalScreenTitleRow";
import { useGetMerchantStores } from "@/hooks/graphql/queries/useGetMerchantStores";
import { useGetMyMerchants } from "@/hooks/graphql/queries/useGetMyMerchants";
import { useMyOperatorCapabilities } from "@/hooks/graphql/queries/useMyOperatorCapabilities";
import { useWhoAmI } from "@/hooks/graphql/queries/useWhoAmI";
import { useAuthState } from "@/hooks/useAuthState";
import { isOperatorScope } from "@/hooks/useOperatorAccess/utils";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

export default function GrantedAppAccessScreen() {
  const { t } = useTranslation();
  const { isLoggedIn } = useAuthState();
  const { data: whoData } = useWhoAmI();
  const roles = whoData?.whoAmI?.roles ?? [];
  const isOwner = roles.some((r) => r.trim().toUpperCase() === "OWNER");

  const { data: capData } = useMyOperatorCapabilities({
    skip: !isLoggedIn || isOwner,
  });
  const merchantScopes = useMemo(() => {
    const raw = capData?.myOperatorCapabilities?.merchantScopes ?? [];
    return raw.filter(isOperatorScope);
  }, [capData?.myOperatorCapabilities?.merchantScopes]);

  const { data: merchantsData } = useGetMyMerchants({ skip: !isLoggedIn });
  const { data: storesData } = useGetMerchantStores({
    skip: !isLoggedIn || isOwner,
  });

  const merchantNameById = useMemo(() => {
    const map = new Map<string, string>();
    (merchantsData?.myMerchants ?? []).forEach((m) => {
      if (m.id && m.name) {
        map.set(m.id, m.name);
      }
    });
    return map;
  }, [merchantsData?.myMerchants]);

  const scopeCards = useMemo(() => {
    const stores = storesData?.myStores ?? [];
    return merchantScopes.map((scope) => {
      const merchantStores = stores.filter((s) => s.merchantId === scope.merchantId);
      const storeNames = scope.storeScopeAll
        ? []
        : scope.storeIds
            .map((id) => merchantStores.find((s) => s.id === id)?.name ?? id)
            .filter((n) => n.length > 0);
      return {
        scope,
        storeNames,
        merchantName: merchantNameById.get(scope.merchantId) ?? scope.merchantId,
      };
    });
  }, [merchantScopes, storesData?.myStores, merchantNameById]);

  const ownedMerchants = useMemo(() => {
    if (!isOwner) {
      return [];
    }
    return merchantsData?.myMerchants ?? [];
  }, [isOwner, merchantsData?.myMerchants]);

  const showEmptyCooperator = !isOwner && merchantScopes.length === 0;

  return (
    <ProfileStackScrollScreen>
      <TechnicalScreenTitleRow title={t("AccountHub.settingsAccess")} />

      {isOwner ? (
        <>
          <SettingsSectionHeading title={t("AccountHub.ownerGrantedAccessHeading")} />
          <SettingsSectionCard>
            <View className="p-4 gap-3">
              {ownedMerchants.length === 0 ? (
                <Typography variant="text-14-regular-spaced" className="text-cool-gray">
                  {t("AccountHub.ownerNoMerchants")}
                </Typography>
              ) : (
                ownedMerchants.map((m) => (
                  <Typography key={m.id} variant="text-16-regular" className="text-dark">
                    {m.name}
                  </Typography>
                ))
              )}
            </View>
          </SettingsSectionCard>
        </>
      ) : null}

      {!isOwner && merchantScopes.length > 0 ? (
        <>
          <SettingsSectionHeading title={t("AccountHub.cooperatorGrantedAccessHeading")} />
          <View className="gap-4">
            {scopeCards.map(({ scope, merchantName, storeNames }) => (
              <GrantedOperatorMerchantScopeCard
                key={scope.merchantId}
                merchantName={merchantName}
                scope={scope}
                storeNames={storeNames}
              />
            ))}
          </View>
        </>
      ) : null}

      {showEmptyCooperator ? (
        <Typography variant="text-14-regular-spaced" className="text-cool-gray">
          {t("AccountHub.cooperatorAccessEmpty")}
        </Typography>
      ) : null}
    </ProfileStackScrollScreen>
  );
}
