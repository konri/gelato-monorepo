import Constants from 'expo-constants';
import i18n from 'i18next';

/**
 * Client identity sent with every request (BRANDS_SPEC §2.8, §4.1).
 *
 * The backend reads `x-loodly-client: <app>@<version>` and `x-loodly-api` to
 * decide whether a build is too old (UPGRADE_REQUIRED, off unless the server
 * sets MIN_CLIENT_API). Over graphql-ws the same values travel in
 * `connectionParams.client` / `connectionParams.api`.
 */
export const CLIENT_APP = 'spot';
export const API_LEVEL = 2;
export const APP_VERSION: string = Constants.expoConfig?.version ?? '0.0.0';

const clientTag = () => `${CLIENT_APP}@${APP_VERSION}`;

// The app language as an HTTP language tag (the app calls Ukrainian "ua").
// Before sign-in the server localizes its texts (wrong password, reset codes,
// rate limits) from Accept-Language only, which Android does not send at all.
const LANGUAGE_TAGS: Record<string, string> = { pl: 'pl', en: 'en', ua: 'uk', uk: 'uk' };
const languageTag = (): string | null => LANGUAGE_TAGS[(i18n.language ?? '').slice(0, 2).toLowerCase()] ?? null;

/** Headers for HTTP requests (GraphQL, REST, uploads, reports). */
export const clientHeaders = (): Record<string, string> => {
  const lang = languageTag();
  return {
    'x-loodly-client': clientTag(),
    'x-loodly-api': String(API_LEVEL),
    ...(lang ? { 'Accept-Language': lang } : {}),
  };
};

/** graphql-ws `connectionParams` additions. */
export const clientConnectionParams = (): { client: string; api: number } => ({
  client: clientTag(),
  api: API_LEVEL,
});
