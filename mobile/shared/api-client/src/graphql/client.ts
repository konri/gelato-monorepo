import { DocumentNode } from '@apollo/client';
import { CombinedGraphQLErrors, ServerError } from '@apollo/client/errors';
import { logGraphQLError } from '@/utils/graphqlErrorLogger';
import { OperationDefinitionNode } from 'graphql';
import { createApolloServerClient } from './apollo-server';
import { ApolloServerConfig, GraphQLResult } from './types';

type GraphqlErrorsPayload = { errors?: ReadonlyArray<{ message?: string }> };

const operationNameFromDocument = (document: DocumentNode): string => {
  const operationDefinition = document.definitions.find(
    (definition): definition is OperationDefinitionNode => definition.kind === 'OperationDefinition',
  );
  return operationDefinition?.name?.value ?? 'Unknown';
};

function messageFromUnknownGraphQlError(error: unknown): string {
  if (CombinedGraphQLErrors.is(error)) {
    const first = error.errors[0]?.message;
    return first ?? error.message;
  }
  if (ServerError.is(error)) {
    const raw = error.bodyText?.trim();
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as GraphqlErrorsPayload;
        const fromGraphql = parsed.errors?.map((e) => e.message).filter(Boolean).join('\n');
        if (fromGraphql) {
          return fromGraphql;
        }
      } catch {
        /* body is not JSON */
      }
      return raw.length > 800 ? `${raw.slice(0, 800)}…` : raw;
    }
    return `HTTP ${error.statusCode}: ${error.message}`;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Unknown GraphQL error';
}

export interface GraphQLOptions extends ApolloServerConfig {
  variables?: Record<string, any>;
  fetchPolicy?: 'cache-first' | 'network-only' | 'cache-only' | 'no-cache';
}

// An expired/invalid access token surfaces as one of these from the API.
const isAuthError = (message: string): boolean => {
  const m = message.toLowerCase();
  return (
    m.includes('access denied') ||
    m.includes('not authenticated') ||
    m.includes('unauthorized') ||
    m.includes('unauthenticated') ||
    m.includes('jwt expired') ||
    m.includes('invalid token')
  );
};

export async function executeGraphQLQuery<T>(
  query: DocumentNode,
  options: GraphQLOptions = {},
): Promise<GraphQLResult<T>> {
  const { variables = {}, token, apiUrl, fetchPolicy = 'network-only' } = options;
  const resolvedOperationName = operationNameFromDocument(query);

  const operationType =
    query.definitions[0]?.kind === 'OperationDefinition'
      ? query.definitions[0].operation
      : 'query';

  // One attempt with a given (optional) explicit token override.
  const run = async (tokenOverride?: string): Promise<GraphQLResult<T>> => {
    const apolloServerClient = await createApolloServerClient({
      token: tokenOverride ?? token,
      apiUrl,
    });

    if (operationType === 'mutation') {
      const mutateResult = await apolloServerClient.mutate({ mutation: query, variables });
      if (mutateResult.error) {
        return {
          data: null,
          error: { message: messageFromUnknownGraphQlError(mutateResult.error) },
          success: false,
        };
      }
      if (mutateResult.data == null) {
        return { data: null, error: { message: 'Empty mutation response' }, success: false };
      }
      return { data: mutateResult.data as T, error: null, success: true };
    }

    const queryResult = await apolloServerClient.query({ query, variables, fetchPolicy });
    if (queryResult.error) {
      return {
        data: null,
        error: { message: messageFromUnknownGraphQlError(queryResult.error) },
        success: false,
      };
    }
    return { data: queryResult.data as T, error: null, success: true };
  };

  // Apollo Client v4 throws on GraphQL/network errors by default (errorPolicy
  // 'none') instead of returning them on the result. Normalise both paths into
  // a GraphQLResult so the auth-refresh retry below always runs.
  const runSafe = async (tokenOverride?: string): Promise<GraphQLResult<T>> => {
    try {
      return await run(tokenOverride);
    } catch (error: unknown) {
      return {
        data: null,
        error: { message: messageFromUnknownGraphQlError(error) },
        success: false,
      };
    }
  };

  let result = await runSafe();

  // On auth failure, transparently refresh the access token once and retry.
  // If refresh can't recover (no/expired refresh token, or the retry still
  // fails with an auth error), the session is dead → clear it and notify the
  // app so it can redirect to login instead of looping "Access denied".
  if (!result.success && result.error && isAuthError(result.error.message)) {
    const { refreshAccessToken } = await import('./refreshToken');
    const newToken = await refreshAccessToken(apiUrl);
    if (newToken) {
      result = await runSafe(newToken);
    }
    if (!result.success && result.error && isAuthError(result.error.message)) {
      const { handleSessionExpired } = await import('../session');
      await handleSessionExpired();
    }
  }

  if (!result.success && result.error) {
    logGraphQLError({ message: result.error.message }, resolvedOperationName);
  }
  return result;
}

export function createGraphQLFunction<TResponse, TResult>(
  query: DocumentNode,
  dataExtractor: (response: TResponse) => TResult,
  defaultErrorMessage: string = 'Request failed',
  fetchPolicy: 'cache-first' | 'network-only' | 'cache-only' | 'no-cache' = 'network-only',
) {
  return async (options?: GraphQLOptions): Promise<GraphQLResult<TResult>> => {
    const result = await executeGraphQLQuery<TResponse>(query, { ...options, fetchPolicy });

    if (!result.success || !result.data) {
      return {
        data: null,
        error: result.error || { message: defaultErrorMessage },
        success: false,
      };
    }

    return {
      data: dataExtractor(result.data),
      error: null,
      success: true,
    };
  };
}
