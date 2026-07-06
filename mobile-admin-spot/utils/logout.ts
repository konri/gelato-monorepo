import { clearPersistedAuthSession } from "@/hooks/useAuthState";
import { resetApolloClient } from "@/shared/api-client/src/graphql/apollo-client";
import { googleSignOutIfConfigured } from "@/utils/googleSignOutIfConfigured";

export const performLogout = async () => {
  await googleSignOutIfConfigured();
  resetApolloClient();
  await clearPersistedAuthSession();
};
