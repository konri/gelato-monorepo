import { safeGetItem } from "@/utils/safeAsyncStorage";

let tokenCache: string | null = null;

export const getAccessTokenCacheSnapshot = (): string | null => tokenCache;

export const resolveBearerAccessToken = async (): Promise<string | null> => {
  let token = tokenCache;
  if (!token) {
    token = await safeGetItem("access_token");
    if (token) {
      tokenCache = token;
    }
  }
  return token;
};

export const updateTokenCache = (token: string | null) => {
  tokenCache = token;
};
