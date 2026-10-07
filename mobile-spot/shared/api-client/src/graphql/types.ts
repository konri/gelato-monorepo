export type GraphQLRequest = {
  query: string;
  variables?: Record<string, any>;
  operationName?: string;
};

export type GraphQLResponse<T = any> = {
  data?: T;
  errors?: Array<{
    message: string;
    locations?: Array<{ line: number; column: number }>;
    path?: string[];
  }>;
  extensions?: Record<string, any>;
};

export type GraphQLClientConfig = {
  url: string;
  headers?: Record<string, string>;
  timeout?: number;
  credentials?: RequestCredentials;
};

export type ApolloServerConfig = {
  token?: string;
  apiUrl?: string;
  /**
   * The caller shows the failure itself (inline error), so skip the global
   * error toast. App-wide reactions (logout, upgrade, revalidation) still run.
   */
  silent?: boolean;
};

export type GraphQLError = {
  message: string;
  /** The server's `errors[0].extensions.code` (e.g. SCOPE_FORBIDDEN), when present. */
  code?: string;
  statusCode?: number;
  /** The rest of `errors[0].extensions` (e.g. `{ cap, kind }` for AWARD_LIMIT_EXCEEDED). */
  extensions?: Record<string, unknown> | null;
  details?: any;
};

export type GraphQLResult<T> = {
  data: T | null;
  error: GraphQLError | null;
  success: boolean;
};
