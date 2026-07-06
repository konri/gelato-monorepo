import { WHO_AM_I_QUERY } from "@/shared/api-client/src/graphql/queries/user/query";
import { GetWhoAmIResponse } from "@/shared/api-client/src/graphql/queries/user/types";
import { logger } from "@/utils/logger";
import { safeSetItem } from "@/utils/safeAsyncStorage";
import { useLazyQuery } from "@apollo/client/react";
import { useAuthState, type AuthUser } from "./useAuthState";

type LoginMethod = "email" | "google";

export const useUserSync = () => {
  const { updateAuthState } = useAuthState();
  const [fetchWhoAmI] = useLazyQuery<GetWhoAmIResponse>(WHO_AM_I_QUERY, {
    fetchPolicy: "network-only",
    errorPolicy: "all",
  });

  const syncUserData = async (loginMethod: LoginMethod = "email") => {
    try {
      const result = await fetchWhoAmI();
      const userData = result.data?.whoAmI;
      if (!userData) {
        return null;
      }
      await safeSetItem(
        "locationPermissionGranted",
        userData.locationPermission ? "true" : "false"
      );
      return userData;
    } catch (error) {
      logger.error(`Error syncing user data for ${loginMethod} login:`, error);
      return null;
    }
  };

  const handlePostLogin = async (
    user: AuthUser,
    token: string,
    loginMethod: LoginMethod = "email",
  ) => {
    const syncedWho = await syncUserData(loginMethod);
    await updateAuthState(syncedWho ?? user, token);
  };

  return {
    syncUserData,
    handlePostLogin,
  };
};
