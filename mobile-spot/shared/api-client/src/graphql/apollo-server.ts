import { config } from '@/config';
import { logger } from '@/utils/logger';
import { ApolloClient, ApolloLink, HttpLink, InMemoryCache } from '@apollo/client';
import { map } from 'rxjs/operators';
import { safeGetItem } from '../utils/safeAsyncStorage';
import { ApolloServerConfig } from './types';

const buildLoggerLink = () =>
  new ApolloLink((operation, forward) => {
    const startTime = Date.now();
    const operationLabel = operation.operationName || 'Unknown';

    return forward(operation).pipe(
      map((response) => {
        const duration = Date.now() - startTime;
        const { data, errors } = response;

        if (errors) {
          const hasPartialData = data && Object.keys(data).length > 0;
          const logData = {
            errors: errors.map((err) => ({
              message: err.message,
              locations: err.locations,
              path: err.path,
              extensions: err.extensions,
            })),
            ...(hasPartialData && { data }),
          };

          const fullLogData = {
            operationName: operationLabel,
            duration: `${duration}ms`,
            ...logData,
          };

          if (hasPartialData) {
            logger.warn(
              `[GraphQL Partial Response] ${operationLabel}`,
              JSON.stringify(fullLogData, null, 2),
            );
          } else {
            logger.error(
              `[GraphQL Error] ${operationLabel}`,
              JSON.stringify(fullLogData, null, 2),
            );
          }
        } else {
          // success — no logging needed
        }

        return response;
      }),
    );
  });

export const createApolloServerClient = async (apolloConfig: ApolloServerConfig = {}) => {
  const { token: providedToken, apiUrl = config.API_URL } = apolloConfig;

  const token = providedToken || (await safeGetItem('access_token'));

  const httpLink = new HttpLink({
    uri: `${apiUrl}/graphql`,
    credentials: 'include',
  });

  const authLink = new ApolloLink((operation, forward) => {
    operation.setContext(({ headers = {} }) => ({
      headers: {
        ...headers,
        authorization: token ? `Bearer ${token}` : '',
      },
    }));
    return forward(operation);
  });

  const loggerLink = buildLoggerLink();

  return new ApolloClient({
    link: ApolloLink.from([loggerLink, authLink, httpLink]),
    cache: new InMemoryCache(),
  });
};
