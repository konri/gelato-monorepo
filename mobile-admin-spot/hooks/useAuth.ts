import { loginUser } from "@/shared/api-client";
import { resetApolloClient } from "@/shared/api-client/src/graphql/apollo-client";
import { googleSignOutIfConfigured } from "@/utils/googleSignOutIfConfigured";
import { useState } from "react";
import { clearPersistedAuthSession } from "./useAuthState";
import { useUserSync } from "./useUserSync";

export const useAuth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { handlePostLogin } = useUserSync();

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await loginUser({
        email,
        password,
        loginContext: "MOBILE_CLIENT",
      });

      if (response.error) {
        const error = new Error(response.error) as any;
        error.status = response.status;
        error.message = response.error;
        throw error;
      }

      if (!response.data) {
        throw new Error("No data returned from login");
      }

      await handlePostLogin(
        response.data.user,
        response.data.token.access_token,
        "email"
      );
      return response.data;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    await googleSignOutIfConfigured();
    resetApolloClient();
    await clearPersistedAuthSession();
  };

  return {
    login,
    logout,
    isLoading,
  };
};
