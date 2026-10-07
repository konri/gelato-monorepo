// API endpoints. VITE_API_URL points at the GraphQL endpoint; the REST auth
// routes live under the same origin at /authorization.
export const GRAPHQL_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:4000/graphql';

export const API_ORIGIN = GRAPHQL_URL.replace(/\/graphql$/, '');

// Console version for the x-loodly-client header. VITE_APP_VERSION wins; the
// build injects package.json's version otherwise (vite.config.ts).
export const APP_VERSION: string = import.meta.env.VITE_APP_VERSION || __APP_VERSION__;

// Web link to the Loodly Spot app ("Open Loodly Spot"); hidden when unset.
export const SPOT_APP_URL: string | undefined = import.meta.env.VITE_SPOT_APP_URL || undefined;

export const ACCESS_TOKEN_KEY = 'admin_access_token';
export const ADMIN_USER_KEY = 'admin_user';
export const LANGUAGE_KEY = 'admin_language';
// Session format marker: '2' = a session stored by the brands console. A
// token without it (old SPA) is revalidated before anything renders.
export const SESSION_VERSION_KEY = 'admin_session_v';
export const SESSION_VERSION = '2';
