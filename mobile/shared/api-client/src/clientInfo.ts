import Constants from 'expo-constants';

/**
 * Identifies this build to the backend (BRANDS_SPEC §5.2, CONTRACTS §6).
 *
 *   x-loodly-client: client@<app version>
 *   x-loodly-api:    2
 *
 * Sent on every HTTP request (Apollo, REST, token refresh, uploads) and in the
 * graphql-ws `connectionParams`. The server uses it only for the
 * UPGRADE_REQUIRED gate; resolvers never branch on the version.
 */
export const CLIENT_APP = 'client';
export const CLIENT_API_VERSION = 2;

export const appVersion = (): string =>
  Constants.expoConfig?.version ?? Constants.nativeAppVersion ?? '0.0.0';

export const clientHeaders = (): Record<string, string> => ({
  'x-loodly-client': `${CLIENT_APP}@${appVersion()}`,
  'x-loodly-api': String(CLIENT_API_VERSION),
});

/** graphql-ws connection params (the server also reads `headers[...]`). */
export const clientConnectionParams = (): { client: string; api: number } => ({
  client: `${CLIENT_APP}@${appVersion()}`,
  api: CLIENT_API_VERSION,
});
