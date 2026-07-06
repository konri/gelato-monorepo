import { config } from "@/config";
import { clearPersistedAuthSession } from "@/hooks/useAuthState";
import { isAccessDeniedGraphQlMessage } from "@/utils/apolloError";
import { googleSignOutIfConfigured } from "@/utils/googleSignOutIfConfigured";
import { logger } from "@/utils/logger";
import { safeSetItem } from "@/utils/safeAsyncStorage";
import { InteractionManager } from "react-native";
import {
  ApolloClient,
  ApolloLink,
  HttpLink,
  InMemoryCache,
} from "@apollo/client";
import { SetContextLink } from "@apollo/client/link/context";
import { ErrorLink } from "@apollo/client/link/error";
import { CombinedGraphQLErrors, ServerError } from "@apollo/client/errors";
import { map } from "rxjs/operators";

import {
  getAccessTokenCacheSnapshot,
  resolveBearerAccessToken,
  updateTokenCache,
} from "./authTokenCache";
import { inMemoryTypePolicies } from "./cache/inMemoryTypePolicies";

let apolloClient: ApolloClient | null = null;

let sessionInvalidationInFlight = false;

export const scheduleForcedLogoutForInvalidServerSession = (reason?: string) => {
  if (sessionInvalidationInFlight) {
    return;
  }
  sessionInvalidationInFlight = true;
  if (reason) {
    logger.warn(`[Auth] Forced logout triggered: ${reason}`);
  }
  void (async () => {
    try {
      resetApolloClient();
      await googleSignOutIfConfigured();
      await clearPersistedAuthSession();
    } finally {
      sessionInvalidationInFlight = false;
    }
  })();
};

const httpLink = new HttpLink({
  uri: `${config.API_URL}/graphql`,
  credentials: "include",
});

const authLink = new SetContextLink(async (prevContext, operation) => {
  const token = await resolveBearerAccessToken();
  return {
    ...prevContext,
    headers: {
      ...prevContext.headers,
      authorization: token ? `Bearer ${token}` : "",
    },
  };
});

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const extractTokenFromResponse = (data: unknown): string | null => {
  if (!isRecord(data)) {
    return null;
  }
  for (const value of Object.values(data)) {
    if (!isRecord(value)) {
      continue;
    }
    if (typeof value.token === "string" && value.token.length > 0) {
      return value.token;
    }
  }
  return null;
};

const isMutationOperation = (operation: { query: { definitions: readonly unknown[] } }): boolean => {
  for (const definition of operation.query.definitions) {
    if (
      isRecord(definition) &&
      definition.kind === "OperationDefinition" &&
      definition.operation === "mutation"
    ) {
      return true;
    }
  }
  return false;
};

const tokenSyncLink = new ApolloLink((operation, forward) =>
  forward(operation).pipe(
    map((response) => {
      const optedOut = operation.getContext()?.syncAuthToken === false;
      if (optedOut || !isMutationOperation(operation)) {
        return response;
      }

      const token = extractTokenFromResponse(response.data);
      if (token && token !== getAccessTokenCacheSnapshot()) {
        logger.debug(
          `[Auth] Refreshed access token from mutation ${operation.operationName ?? "(unknown)"}`,
        );
        updateTokenCache(token);
        void safeSetItem("access_token", token);
        const client = apolloClient;
        InteractionManager.runAfterInteractions(() => {
          void client?.resetStore().catch((error) => {
            logger.warn("Failed to reset Apollo store after token refresh", error);
          });
        });
      }

      return response;
    }),
  ),
);

const isUnauthenticatedExtension = (extensions: unknown): boolean => {
  if (!isRecord(extensions)) {
    return false;
  }
  const code = extensions.code;
  return typeof code === "string" && code.toUpperCase() === "UNAUTHENTICATED";
};

const errorLink = new ErrorLink(({ error, operation }) => {
  const opName = operation.operationName ?? "GraphQL";

  if (ServerError.is(error)) {
    if (error.statusCode === 401) {
      scheduleForcedLogoutForInvalidServerSession(`HTTP 401 on ${opName}`);
    }
    return;
  }

  if (!CombinedGraphQLErrors.is(error)) {
    return;
  }

  const opContext = operation.getContext();
  const authHeader = opContext.headers?.authorization;
  const hadBearerToken =
    typeof authHeader === "string" && authHeader.startsWith("Bearer ");
  if (!hadBearerToken) {
    return;
  }

  const userNotFoundIsTolerated =
    opContext.userNotFoundDoesNotInvalidateSession === true;

  const shouldInvalidate = error.errors.some((graphqlError) => {
    if (isUnauthenticatedExtension(graphqlError.extensions)) {
      return true;
    }
    if (graphqlError.message === "User not found" && !userNotFoundIsTolerated) {
      return true;
    }
    return false;
  });

  if (shouldInvalidate) {
    scheduleForcedLogoutForInvalidServerSession(`invalid session on ${opName}`);
  }
});

const sanitizeHeadersForLog = (
  headers: Record<string, unknown>,
): Record<string, unknown> => {
  const auth = headers.authorization;
  if (typeof auth === "string" && auth.startsWith("Bearer ")) {
    return {
      ...headers,
      authorization: `Bearer <redacted len=${auth.length - "Bearer ".length}>`,
    };
  }
  return headers;
};

const loggerLink = new ApolloLink((operation, forward) => {
  const { operationName, variables, query, getContext } = operation;
  const startTime = Date.now();
  const operationLabel = operationName || "Unknown";
  const rawHeaders = getContext()?.headers;
  const headers =
    rawHeaders && typeof rawHeaders === "object" && !Array.isArray(rawHeaders)
      ? sanitizeHeadersForLog(rawHeaders as Record<string, unknown>)
      : rawHeaders || {};

  logger.debug(
    `[GraphQL Request] ${operationLabel}`,
    JSON.stringify(
      {
        operationName,
        variables,
        query: query.loc?.source.body || String(query),
        headers,
      },
      null,
      2,
    ),
  );

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
          operationName,
          duration: `${duration}ms`,
          ...logData,
        };

        const onlyAccessDenied =
          errors.length > 0 &&
          errors.every((err) => isAccessDeniedGraphQlMessage(err.message));

        if (hasPartialData) {
          logger.warn(
            `[GraphQL Partial Response] ${operationLabel}`,
            JSON.stringify(fullLogData, null, 2),
          );
        } else if (onlyAccessDenied) {
          logger.debug(
            `[GraphQL Response — permission denied] ${operationLabel}`,
            JSON.stringify(fullLogData, null, 2),
          );
        } else {
          logger.error(
            `[GraphQL Error] ${operationLabel}`,
            JSON.stringify(fullLogData, null, 2),
          );
        }
      } else {
        logger.debug(
          `[GraphQL Response] ${operationLabel} (${duration}ms)`,
          JSON.stringify(
            {
              operationName,
              data,
            },
            null,
            2,
          ),
        );
      }

      return response;
    }),
  );
});

export const getApolloClient = (): ApolloClient => {
  if (apolloClient) {
    return apolloClient;
  }

  apolloClient = new ApolloClient({
    link: ApolloLink.from([
      errorLink,
      authLink,
      loggerLink,
      tokenSyncLink,
      httpLink,
    ]),
    cache: new InMemoryCache({
      typePolicies: inMemoryTypePolicies,
    }),
    defaultOptions: {
      watchQuery: {
        fetchPolicy: "cache-first",
        errorPolicy: "all",
      },
      query: {
        fetchPolicy: "cache-first",
        errorPolicy: "all",
      },
    },
  });

  return apolloClient;
};

export const resetApolloClient = () => {
  if (apolloClient) {
    apolloClient.clearStore();
    apolloClient = null;
  }
  updateTokenCache(null);
};
