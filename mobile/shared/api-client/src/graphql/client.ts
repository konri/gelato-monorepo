import { DocumentNode } from '@apollo/client';
import { CombinedGraphQLErrors, ServerError } from '@apollo/client/errors';
import { logGraphQLError } from '@/utils/graphqlErrorLogger';
import { OperationDefinitionNode } from 'graphql';
import { emitUpgradeRequired, upgradeInfoFrom } from '../upgradeEvents';
import { createApolloServerClient } from './apollo-server';
import { ApolloServerConfig, GraphQLError, GraphQLResult } from './types';

type FormattedError = { message?: string; extensions?: Record<string, unknown> };
type GraphqlErrorsPayload = { errors?: readonly FormattedError[] };

const operationNameFromDocument = (document: DocumentNode): string => {
  const operationDefinition = document.definitions.find(
    (definition): definition is OperationDefinitionNode => definition.kind === 'OperationDefinition',
  );
  return operationDefinition?.name?.value ?? 'Unknown';
};

/** The first error that carries `extensions.code`, else the first error. */
const pickError = (errors: readonly FormattedError[]): FormattedError | undefined =>
  errors.find((e) => typeof e?.extensions?.code === 'string') ?? errors[0];

const fromFormatted = (errors: readonly FormattedError[], fallback: string): GraphQLError => {
  const picked = pickError(errors);
  const message = picked?.message || errors[0]?.message || fallback;
  const extensions = picked?.extensions;
  const code = typeof extensions?.code === 'string' ? extensions.code : undefined;
  return { message, code, extensions, details: extensions };
};

/**
 * Normalises whatever Apollo threw / returned into `{ message, code, extensions }`.
 * The backend puts a machine-readable code in `extensions.code` (CONTRACTS §4).
 */
function errorFromUnknown(error: unknown): GraphQLError {
  if (CombinedGraphQLErrors.is(error)) {
    return fromFormatted(error.errors as readonly FormattedError[], error.message);
  }
  if (ServerError.is(error)) {
    const raw = error.bodyText?.trim();
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as GraphqlErrorsPayload;
        if (parsed.errors?.length) {
          return { ...fromFormatted(parsed.errors, raw), statusCode: error.statusCode };
        }
      } catch {
        /* body is not JSON */
      }
      return {
        message: raw.length > 800 ? `${raw.slice(0, 800)}…` : raw,
        statusCode: error.statusCode,
      };
    }
    return { message: `HTTP ${error.statusCode}: ${error.message}`, statusCode: error.statusCode };
  }
  if (error instanceof Error) {
    return { message: error.message };
  }
  return { message: 'Unknown GraphQL error' };
}

export interface GraphQLOptions extends ApolloServerConfig {
  variables?: Record<string, any>;
  fetchPolicy?: 'cache-first' | 'network-only' | 'cache-only' | 'no-cache';
  /**
   * Domain error codes the caller handles itself (e.g. INSUFFICIENT_POINTS,
   * REWARD_UNAVAILABLE): no generic error toast for them.
   */
  silentCodes?: readonly string[];
  /** Never show the generic error toast (background refreshes). */
  silent?: boolean;
  /**
   * No token refresh and no session end on an auth failure. For the logout's
   * own clean-up call: a refresh finishing after the logout cleared the
   * tokens would write the leaving user's token back (or over the next
   * user's), and the logout ends the session itself.
   */
  noAuthRecovery?: boolean;
}

/**
 * Legacy message heuristics, used ONLY when the error carries no
 * `extensions.code` (e.g. a proxy error page). With a code, only
 * UNAUTHENTICATED refreshes the token or logs out (BRANDS_SPEC §5.2).
 */
const isAuthMessage = (message: string): boolean => {
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

export const isAuthError = (error: GraphQLError | null | undefined): boolean => {
  if (!error) return false;
  if (error.code) return error.code === 'UNAUTHENTICATED';
  return isAuthMessage(error.message);
};

/** Codes that never produce the generic toast: the app handles them globally. */
const GLOBAL_SILENT_CODES = new Set(['UNAUTHENTICATED', 'UPGRADE_REQUIRED']);

export async function executeGraphQLQuery<T>(
  query: DocumentNode,
  options: GraphQLOptions = {},
): Promise<GraphQLResult<T>> {
  const {
    variables = {},
    token,
    apiUrl,
    fetchPolicy = 'network-only',
    silentCodes,
    silent = false,
    noAuthRecovery = false,
  } = options;
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
        return { data: null, error: errorFromUnknown(mutateResult.error), success: false };
      }
      if (mutateResult.data == null) {
        return { data: null, error: { message: 'Empty mutation response' }, success: false };
      }
      return { data: mutateResult.data as T, error: null, success: true };
    }

    const queryResult = await apolloServerClient.query({ query, variables, fetchPolicy });
    if (queryResult.error) {
      return { data: null, error: errorFromUnknown(queryResult.error), success: false };
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
      return { data: null, error: errorFromUnknown(error), success: false };
    }
  };

  let result = await runSafe();

  // Only UNAUTHENTICATED refreshes the access token (once) and retries. If the
  // refresh can't recover, the session is dead → clear it and notify the app so
  // it can redirect to login. Domain codes (SCOPE_FORBIDDEN, INSUFFICIENT_POINTS,
  // REWARD_*, …) never refresh or log out.
  if (!result.success && isAuthError(result.error) && !noAuthRecovery) {
    const { refreshAccessToken } = await import('./refreshToken');
    const newToken = await refreshAccessToken(apiUrl);
    if (newToken) {
      result = await runSafe(newToken);
    }
    if (!result.success && isAuthError(result.error)) {
      const { handleSessionExpired } = await import('../session');
      await handleSessionExpired();
    }
  }

  if (!result.success && result.error) {
    const code = result.error.code;
    if (code === 'UPGRADE_REQUIRED') {
      emitUpgradeRequired(upgradeInfoFrom(result.error.extensions));
    }
    logGraphQLError({ message: result.error.message }, resolvedOperationName);
    // Surface a friendly toast for other failures (auth errors redirect to
    // login via the session flow above; the upgrade gate covers the app).
    const silenced =
      silent ||
      isAuthError(result.error) ||
      (code != null && (GLOBAL_SILENT_CODES.has(code) || !!silentCodes?.includes(code)));
    if (!silenced) {
      const { emitRequestError } = await import('../errorEvents');
      emitRequestError(result.error.message);
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
