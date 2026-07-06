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
};

export type GraphQLError = {
  message: string;
  code?: string;
  statusCode?: number;
  details?: any;
};

export type GraphQLResult<T> = {
  data: T | null;
  error: GraphQLError | null;
  success: boolean;
};
