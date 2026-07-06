const DEFAULT_BACKEND_API_URL = "https://api-dev.easybons.com";

const normalizeBackendBaseUrl = (raw: string): string => {
  let url = raw.trim().replace(/\/+$/, "");
  if (url.endsWith("/graphql")) {
    url = url.slice(0, -"/graphql".length).replace(/\/+$/, "");
  }
  return url;
};

const getApiUrl = () => {
  const fromEnv = process.env.EXPO_PUBLIC_BACKEND_API_URL?.trim();
  if (fromEnv) {
    return normalizeBackendBaseUrl(fromEnv);
  }
  return DEFAULT_BACKEND_API_URL;
};

const getConsumerWebAppOrigin = () => {
  const raw = process.env.EXPO_PUBLIC_CONSUMER_WEB_APP_ORIGIN?.trim();
  if (raw && raw.length > 0) {
    return raw.replace(/\/+$/, "");
  }
  return "https://app.easybons.com";
};

export const config = {
  API_URL: getApiUrl(),
  CONSUMER_WEB_APP_ORIGIN: getConsumerWebAppOrigin(),

  GOOGLE_WEB_CLIENT_ID:
    process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ||
    "549326700978-nn5h5eqvon1c2fkl1b96ja0n640grr59.apps.googleusercontent.com",
  GOOGLE_IOS_CLIENT_ID:
    process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ||
    "549326700978-qqbvmfajruhfjsepgkj09hamme92r82q.apps.googleusercontent.com",

  MAPBOX_ACCESS_TOKEN: process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN || "",
} as const;

export const GOOGLE_SIGNIN_CONFIG = {
  webClientId: config.GOOGLE_WEB_CLIENT_ID,
  iosClientId: config.GOOGLE_IOS_CLIENT_ID,
  offlineAccess: true,
};
