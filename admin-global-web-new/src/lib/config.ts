// API endpoints. VITE_API_URL points at the GraphQL endpoint; the REST auth
// routes live under the same origin at /authorization.
export const GRAPHQL_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:4000/graphql';

export const API_ORIGIN = GRAPHQL_URL.replace(/\/graphql$/, '');

export const ACCESS_TOKEN_KEY = 'admin_access_token';
export const ADMIN_USER_KEY = 'admin_user';
