import { ApolloClient, InMemoryCache, HttpLink, ApolloLink } from '@apollo/client';
import { SetContextLink } from '@apollo/client/link/context';
import { ErrorLink } from '@apollo/client/link/error';
import { ACCESS_TOKEN_KEY, GRAPHQL_URL } from './config';
import { CLIENT_HEADERS } from './clientInfo';
import { errorInfo } from './errors';
import { emitSessionEvent } from './sessionEvents';
import { typePolicies } from './cachePolicies';

const httpLink = new HttpLink({ uri: GRAPHQL_URL });

// Attach the admin bearer token and the client headers to every request.
const authLink = new SetContextLink((prevContext) => {
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);
  return {
    headers: {
      ...prevContext.headers,
      ...CLIENT_HEADERS,
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
  };
});

/**
 * Session handling by error code (BRANDS_SPEC §3.1): log out ONLY on
 * UNAUTHENTICATED or HTTP 401; PASSWORD_CHANGE_REQUIRED routes to
 * /change-password; UPGRADE_REQUIRED asks for a reload. Every other code is
 * left to the page, which shows it (lib/errors.ts) and never logs out.
 */
const errorLink = new ErrorLink(({ error }) => {
  const { code } = errorInfo(error);
  if (code === 'UNAUTHENTICATED') {
    if (localStorage.getItem(ACCESS_TOKEN_KEY)) emitSessionEvent('unauthenticated');
  } else if (code === 'PASSWORD_CHANGE_REQUIRED') {
    emitSessionEvent('password-change-required');
  } else if (code === 'UPGRADE_REQUIRED') {
    emitSessionEvent('upgrade-required');
  }
});

export const apolloClient = new ApolloClient({
  link: ApolloLink.from([errorLink, authLink, httpLink]),
  cache: new InMemoryCache({ typePolicies }),
});
