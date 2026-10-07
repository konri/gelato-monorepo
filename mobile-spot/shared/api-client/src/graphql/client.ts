import { DocumentNode } from '@apollo/client';
import { CombinedGraphQLErrors, ServerError } from '@apollo/client/errors';
import { logGraphQLError } from '@/utils/graphqlErrorLogger';
import { OperationDefinitionNode } from 'graphql';
import { CLIENT_ERROR_CODES, isNetworkFailure, isRequestTimeoutError } from '../utils/fetchWithTimeout';
import { createApolloServerClient } from './apollo-server';
import { ApolloServerConfig, GraphQLError, GraphQLResult } from './types';

type GraphqlErrorEntry = { message?: string; extensions?: Record<string, unknown> | null };
type GraphqlErrorsPayload = { errors?: ReadonlyArray<GraphqlErrorEntry> };

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

/**
 * `errors[0].extensions` of a failed operation: `code` (UNAUTHENTICATED,
 * SCOPE_FORBIDDEN, a loyalty code…) plus the code's extras. Apps branch on the
 * code, never on the message text (BRANDS_SPEC §2.8).
 */
function extensionsFromUnknownGraphQlError(error: unknown): Record<string, unknown> | null {
  if (CombinedGraphQLErrors.is(error)) {
    const ext = error.errors[0]?.extensions;
    return ext && typeof ext === 'object' ? (ext as Record<string, unknown>) : null;
  }
  if (ServerError.is(error)) {
    const raw = error.bodyText?.trim();
    if (!raw) return error.statusCode === 401 ? { code: 'UNAUTHENTICATED' } : null;
    try {
      const parsed = JSON.parse(raw) as GraphqlErrorsPayload & { code?: unknown };
      const ext = parsed.errors?.[0]?.extensions;
      if (ext && typeof ext === 'object') return ext;
      // REST-style body ({ code, error }) from a gate in front of /graphql.
      if (typeof parsed.code === 'string') return { code: parsed.code };
    } catch {
      /* body is not JSON */
    }
    return error.statusCode === 401 ? { code: 'UNAUTHENTICATED' } : null;
  }
  return null;
}

function toGraphQLError(error: unknown): GraphQLError {
  // No answer from the server (15 s deadline, offline): a client-side code, so
  // screens can say "connection problem, try again" and keep their requestId.
  if (isRequestTimeoutError(error)) {
    return { message: error.message, code: CLIENT_ERROR_CODES.TIMEOUT, extensions: null };
  }
  if (isNetworkFailure(error)) {
    return { message: (error as Error).message, code: CLIENT_ERROR_CODES.NETWORK, extensions: null };
  }
  const extensions = extensionsFromUnknownGraphQlError(error);
  const rawCode = extensions?.code;
  return {
    message: messageFromUnknownGraphQlError(error),
    code: typeof rawCode === 'string' ? rawCode : undefined,
    extensions,
  };
}

export interface GraphQLOptions extends ApolloServerConfig {
  variables?: Record<string, any>;
  fetchPolicy?: 'cache-first' | 'network-only' | 'cache-only' | 'no-cache';
}

// Builds before the brands release matched these texts; the server still sends
// them for UNAUTHENTICATED ("Access denied! …"), so they only count when the
// error carries no code at all (e.g. a bare HTTP 401 body).
const LEGACY_AUTH_TEXTS = [
  'access denied',
  'not authenticated',
  'unauthorized',
  'unauthenticated',
  'jwt expired',
  'invalid token',
];

/**
 * True when the session itself is invalid: `UNAUTHENTICATED`, or a code-less
 * error with one of the legacy auth texts. Any other code (SCOPE_FORBIDDEN,
 * BRAND_INACTIVE, AWARD_LIMIT_EXCEEDED…) is a domain error and never logs out.
 */
const isAuthError = (error: GraphQLError): boolean => {
  if (error.code) return error.code === 'UNAUTHENTICATED';
  const m = error.message.toLowerCase();
  return LEGACY_AUTH_TEXTS.some((text) => m.includes(text));
};

// Codes with their own app-wide reaction (codeEvents) — no generic toast.
const SILENT_CODES = new Set(['PASSWORD_CHANGE_REQUIRED', 'UPGRADE_REQUIRED']);

export async function executeGraphQLQuery<T>(
  query: DocumentNode,
  options: GraphQLOptions = {},
): Promise<GraphQLResult<T>> {
  const { variables = {}, token, apiUrl, fetchPolicy = 'network-only', silent = false } = options;
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
          error: toGraphQLError(mutateResult.error),
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
        error: toGraphQLError(queryResult.error),
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
        error: toGraphQLError(error),
        success: false,
      };
    }
  };

  let result = await runSafe();

  // On UNAUTHENTICATED, transparently refresh the access token once and retry.
  // If refresh can't recover (no/expired refresh token, or the retry still
  // fails with UNAUTHENTICATED), the session is dead → clear it and notify the
  // app so it can redirect to login. Domain codes never log out.
  if (!result.success && result.error && isAuthError(result.error)) {
    const { refreshAccessToken } = await import('./refreshToken');
    const newToken = await refreshAccessToken(apiUrl);
    if (newToken) {
      result = await runSafe(newToken);
    }
    if (!result.success && result.error && isAuthError(result.error)) {
      const { handleSessionExpired } = await import('../session');
      await handleSessionExpired();
    }
  }

  if (!result.success && result.error) {
    const { message, code, extensions } = result.error;
    logGraphQLError({ message }, resolvedOperationName);
    // App-wide reactions: revalidate the spot context, forced password change,
    // upgrade overlay.
    const { emitCodeEvent } = await import('../codeEvents');
    emitCodeEvent(code, message, extensions);
    // Surface a friendly toast for other failures (auth errors redirect to
    // login via the session flow above, so we don't toast those).
    if (!silent && !isAuthError(result.error) && !(code && SILENT_CODES.has(code))) {
      const { emitRequestError } = await import('../errorEvents');
      emitRequestError(message, code);
    }
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
