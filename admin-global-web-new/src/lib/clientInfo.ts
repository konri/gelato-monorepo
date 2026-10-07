import { APP_VERSION } from './config';

/**
 * Identifies the console to the backend (BRANDS_SPEC §2.8, §3.1). Sent on
 * REST, GraphQL and uploads. The login gate relies on it: a spot admin or an
 * employee signing in here gets USE_SPOT_APP instead of a session.
 */
export const CLIENT_APP = 'admin-web';
export const API_CONTRACT = '2';

export const CLIENT_HEADERS: Readonly<Record<string, string>> = {
  'x-loodly-client': `${CLIENT_APP}@${APP_VERSION}`,
  'x-loodly-api': API_CONTRACT,
};
