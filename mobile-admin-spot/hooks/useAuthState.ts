import { updateTokenCache } from "@/shared/api-client/src/graphql/authTokenCache";
import type { UserData } from "@/shared/api-client/src/graphql/queries/user/types";
import { User } from "@/shared/types/user";
import { logger } from "@/utils/logger";
import {
    safeMultiGet,
    safeMultiRemove,
    safeMultiSet,
} from "@/utils/safeAsyncStorage";
import {
  clearUserCache,
  getUserFromCache,
  setUserCache,
} from "@/utils/userCache";
import { useCallback, useEffect, useState } from "react";

export type AuthUser = User | UserData;

interface AuthState {
  isLoggedIn: boolean;
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
}

const INITIAL_AUTH_STATE: AuthState = {
  isLoggedIn: false,
  user: null,
  token: null,
  isLoading: true,
};

let sharedAuthState: AuthState = INITIAL_AUTH_STATE;
let loadAuthStatePromise: Promise<void> | null = null;
const listeners = new Set<(state: AuthState) => void>();

const emitAuthState = () => {
  listeners.forEach((listener) => listener(sharedAuthState));
};

const setSharedAuthState = (nextState: AuthState) => {
  sharedAuthState = nextState;
  emitAuthState();
};

export const clearPersistedAuthSession = async (): Promise<void> => {
  try {
    updateTokenCache(null);
    await safeMultiRemove([
      "isLoggedIn",
      "userData",
      "access_token",
      "userEmail",
    ]);

    clearUserCache();

    setSharedAuthState({
      isLoggedIn: false,
      user: null,
      token: null,
      isLoading: false,
    });
  } catch (error) {
    logger.error("Error clearing persisted auth session:", error);
  }
};

const loadSharedAuthState = async () => {
  if (loadAuthStatePromise) {
    return loadAuthStatePromise;
  }

  loadAuthStatePromise = (async () => {
    try {
      const [isLoggedIn, token] = await safeMultiGet(["isLoggedIn", "access_token"]);
      const persistedLoggedIn = isLoggedIn[1] === "true";
      const user = await getUserFromCache();
      const accessToken = token[1];
      const hasValidToken =
        typeof accessToken === "string" && accessToken.length > 0;

      if (persistedLoggedIn && !hasValidToken) {
        logger.warn(
          "Auth state inconsistency: isLoggedIn=true but no access token. Clearing session.",
        );
        await clearPersistedAuthSession();
        return;
      }

      const finalToken = hasValidToken ? accessToken : null;
      updateTokenCache(finalToken);
      setSharedAuthState({
        isLoggedIn: persistedLoggedIn && hasValidToken,
        user,
        token: finalToken,
        isLoading: false,
      });
    } catch (error) {
      logger.error("Error loading auth state:", error);
      updateTokenCache(null);
      setSharedAuthState({
        isLoggedIn: false,
        user: null,
        token: null,
        isLoading: false,
      });
    }
  })().finally(() => {
    loadAuthStatePromise = null;
  });

  return loadAuthStatePromise;
};

export const useAuthState = () => {
  const [authState, setAuthState] = useState<AuthState>(sharedAuthState);

  const updateAuthState = useCallback(async (user: AuthUser, token: string) => {
    try {
      updateTokenCache(token);
      await safeMultiSet([
        ["isLoggedIn", "true"],
        ["access_token", token],
        ["userEmail", user.email],
      ]);

      await setUserCache(user);

      setSharedAuthState({
        isLoggedIn: true,
        user,
        token,
        isLoading: false,
      });
    } catch (error) {
      logger.error("Error updating auth state:", error);
    }
  }, []);

  const clearAuthState = useCallback(async () => {
    await clearPersistedAuthSession();
  }, []);

  useEffect(() => {
    listeners.add(setAuthState);
    return () => {
      listeners.delete(setAuthState);
    };
  }, []);

  useEffect(() => {
    if (sharedAuthState.isLoading) {
      loadSharedAuthState();
    }
  }, []);

  return {
    ...authState,
    updateAuthState,
    clearAuthState,
    refreshAuthState: loadSharedAuthState,
  };
};
