import {
  extractDeepLinkToken,
  isCooperatorDeepLink,
  PENDING_COOPERATOR_INVITATION_TOKEN_KEY,
} from "@/utils/deepLink";
import { safeSetItem } from "@/utils/safeAsyncStorage";
import { router } from "expo-router";
import { useCallback } from "react";
import { useAuthState } from "./useAuthState";
import { useDeepLink } from "./useDeepLink";

export const useCooperatorDeepLink = () => {
  const { isLoggedIn } = useAuthState();

  const handleDeepLink = useCallback(
    (path: string, params: Record<string, string | string[]>) => {
      const token = extractDeepLinkToken(params);
      if (!token || !isCooperatorDeepLink(path)) {
        return;
      }

      void safeSetItem(PENDING_COOPERATOR_INVITATION_TOKEN_KEY, token);

      if (isLoggedIn) {
        router.replace({
          pathname: "/cooperator-invitation",
          params: { token },
        });
        return;
      }

      router.replace({
        pathname: "/login",
        params: {
          redirectTo: `/cooperator-invitation?token=${token}`,
          cooperatorInviteRequired: "1",
        },
      });
    },
    [isLoggedIn],
  );

  useDeepLink(handleDeepLink, { handleInitialUrl: false });
};
