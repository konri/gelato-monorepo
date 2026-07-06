import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client';
import { SetContextLink } from '@apollo/client/link/context';
import { ACCESS_TOKEN_KEY, GRAPHQL_URL } from './config';

const httpLink = new HttpLink({ uri: GRAPHQL_URL });

// Attach the admin bearer token to every request (Apollo v4 SetContextLink).
const authLink = new SetContextLink((prevContext) => {
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);
  return {
    headers: {
      ...prevContext.headers,
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
  };
});

export const apolloClient = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});
