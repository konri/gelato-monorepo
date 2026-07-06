import { Button } from "@/components/atoms/Button";
import { Typography } from "@/components/atoms/Typography";
import { CustomSafeAreaView } from "@/components/CustomSafeAreaView";
import { SCOPE_MODE_LABEL_KEYS } from "@/constants/operatorPermissions";
import { useAcceptCooperatorInvitation } from "@/hooks/graphql/mutations/useAcceptCooperatorInvitation";
import { usePreviewCooperatorInvitation } from "@/hooks/graphql/queries/usePreviewCooperatorInvitation";
import { useAuthState } from "@/hooks/useAuthState";
import type { PreviewCooperatorInvitationStatus } from "@/shared/api-client/src/graphql/queries/cooperatorInvitations";
import {
  extractDeepLinkToken,
  PENDING_COOPERATOR_INVITATION_TOKEN_KEY,
} from "@/utils/deepLink";
import { safeRemoveItem, safeSetItem } from "@/utils/safeAsyncStorage";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

type InvitationUiStatus = PreviewCooperatorInvitationStatus | "UNKNOWN";

const STATUS_MESSAGE_KEYS: Record<InvitationUiStatus, string | null> = {
  VALID: null,
  ACCEPTED: "Cooperators.invitationAlreadyAccepted",
  NOT_FOUND: "Cooperators.invitationInvalid",
  REVOKED: "Cooperators.invitationInvalid",
  EXPIRED: "Cooperators.invitationInvalid",
  MERCHANT_NOT_FOUND: "Cooperators.invitationInvalid",
  UNKNOWN: "Common.somethingWentWrong",
};

export default function CooperatorInvitationScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams();
  const token = useMemo(() => extractDeepLinkToken(params), [params]);
  const {
    isLoggedIn,
    isLoading: authLoading,
  } = useAuthState();
  const { data, loading, error } = usePreviewCooperatorInvitation({
    token,
    skip: !token,
  });
  const [acceptInvitation, { loading: accepting }] = useAcceptCooperatorInvitation();
  const invitation = data?.previewCooperatorInvitation;
  const invitationStatus: InvitationUiStatus | undefined = invitation?.status
    ? invitation.status
    : error
      ? "UNKNOWN"
      : undefined;
  const statusMessageKey = invitationStatus
    ? STATUS_MESSAGE_KEYS[invitationStatus]
    : null;
  const isInvitationValid = invitationStatus === "VALID" && Boolean(invitation?.valid);
  const invitationScopeMode =
    invitation?.scopeMode === "STORE_SCOPED" ? "STORE_SCOPED" : "FULL_MERCHANT";

  useEffect(() => {
    if (!token || authLoading || isLoggedIn) {
      return;
    }
    router.replace({
      pathname: "/login",
      params: {
        redirectTo: `/cooperator-invitation?token=${token}`,
        cooperatorInviteRequired: "1",
      },
    });
  }, [authLoading, isLoggedIn, token]);

  useEffect(() => {
    if (!token) {
      return;
    }
    void safeSetItem(PENDING_COOPERATOR_INVITATION_TOKEN_KEY, token);
  }, [token]);

  useEffect(() => {
    if (invitationStatus !== "ACCEPTED" || !isLoggedIn) {
      return;
    }
    void safeRemoveItem(PENDING_COOPERATOR_INVITATION_TOKEN_KEY);
    router.replace("/(tabs)");
  }, [invitationStatus, isLoggedIn]);

  const handleLogin = () => {
    if (!token) {
      return;
    }
    router.push(
      `/login?redirectTo=${encodeURIComponent(`/cooperator-invitation?token=${token}`)}`,
    );
  };

  const handleAccept = async () => {
    if (!token) {
      return;
    }
    await acceptInvitation({
      variables: {
        token,
      },
    });
    await safeRemoveItem(PENDING_COOPERATOR_INVITATION_TOKEN_KEY);
    router.replace("/(tabs)");
  };

  return (
    <CustomSafeAreaView className="flex-1 bg-gray-50-light">
      <View className="flex-1 p-6 gap-4">
        <Typography variant="text-24-bold" className="text-black">
          {t("Cooperators.invitationTitle")}
        </Typography>

        {!token && (
          <Typography variant="text-14-regular-spaced" className="text-gray-600">
            {t("Cooperators.invitationMissingToken")}
          </Typography>
        )}

        {(loading || authLoading) && (
          <Typography variant="text-14-regular-spaced" className="text-gray-600">
            {t("Common.loading")}
          </Typography>
        )}

        {isInvitationValid && invitation && (
          <View className="bg-white rounded-2xl p-4 gap-2">
            <Typography variant="text-16-bold" className="text-black">
              {invitation.merchantName}
            </Typography>
            <Typography variant="text-14-regular-spaced" className="text-gray-700">
              {invitation.email}
            </Typography>
            <Typography variant="text-12-regular" className="text-gray-600">
              {t("Cooperators.scopeValue", {
                scope: t(SCOPE_MODE_LABEL_KEYS[invitationScopeMode]),
              })}
            </Typography>
            <Typography variant="text-12-regular" className="text-gray-600">
              {t("Cooperators.invitationValid")}
            </Typography>
          </View>
        )}

        {token && statusMessageKey && (
          <Typography variant="text-14-regular-spaced" className="text-gray-600">
            {t(statusMessageKey)}
          </Typography>
        )}

        {token && isInvitationValid && (
          isLoggedIn ? (
            <Button
              title={t("Cooperators.acceptInvitation")}
              onPress={handleAccept}
              disabled={accepting}
            />
          ) : (
            <Button
              title={t("Cooperators.loginToAccept")}
              onPress={handleLogin}
            />
          )
        )}
      </View>
    </CustomSafeAreaView>
  );
}
