import { CombinedGraphQLErrors, ServerError } from '@apollo/client/errors';
import { logger } from '@/utils/logger';

type GraphQLError = {
  message: string;
  locations?: Array<{ line: number; column: number }>;
  path?: Array<string | number>;
  extensions?: Record<string, unknown>;
};

type NetworkError = {
  message: string;
  statusCode?: number;
  status?: number;
  result?: unknown;
  bodyText?: string;
  response?: {
    status?: number;
    statusText?: string;
  };
};

type ApolloErrorLike = {
  message: string;
  graphQLErrors?: GraphQLError[];
  networkError?: NetworkError;
};

const isApolloErrorLike = (error: unknown): error is ApolloErrorLike => {
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  return 'message' in error;
};

export const logGraphQLError = (error: unknown, operationName?: string): void => {
  const opSuffix = operationName ? ` [${operationName}]` : '';

  if (CombinedGraphQLErrors.is(error)) {
    const errorDetails = {
      operationName: operationName || 'Unknown',
      message: error.message,
      graphQLErrors: error.errors.map((err) => ({
        message: err.message,
        locations: err.locations,
        path: err.path,
        extensions: err.extensions,
      })),
      partialData: error.data,
      extensions: error.extensions,
    };

    logger.error(`GraphQL Error${opSuffix}:`, JSON.stringify(errorDetails, null, 2));

    error.errors.forEach((err) => {
      logger.error(`GraphQL Error: ${err.message}`, {
        locations: err.locations,
        path: err.path,
        extensions: err.extensions,
      });
    });
    return;
  }

  if (ServerError.is(error)) {
    const bodyText = error.bodyText?.trim() ?? '';
    logger.error(
      `Network Error${opSuffix}:`,
      JSON.stringify(
        {
          operationName: operationName || 'Unknown',
          message: error.message,
          statusCode: error.statusCode,
          bodyText: bodyText.length > 800 ? `${bodyText.slice(0, 800)}…` : bodyText,
        },
        null,
        2,
      ),
    );
    return;
  }

  if (!isApolloErrorLike(error)) {
    logger.error(
      `GraphQL Error${opSuffix}:`,
      JSON.stringify({ operationName: operationName || 'Unknown', message: 'Unknown error payload' }, null, 2),
    );
    return;
  }

  const graphQLErrors = error.graphQLErrors || [];
  const networkError = error.networkError;
  const statusCode =
    networkError?.statusCode ?? networkError?.status ?? networkError?.response?.status;

  const errorDetails = {
    operationName: operationName || 'Unknown',
    message: error.message,
    graphQLErrors: graphQLErrors.map((err) => ({
      message: err.message,
      locations: err.locations,
      path: err.path,
      extensions: err.extensions,
    })),
    networkError: networkError
      ? {
          message: networkError.message,
          statusCode,
          result: networkError.result,
          bodyText: networkError.bodyText,
          statusText: networkError.response?.statusText,
        }
      : undefined,
  };

  logger.error(`GraphQL Error${opSuffix}:`, JSON.stringify(errorDetails, null, 2));

  if (graphQLErrors.length > 0) {
    graphQLErrors.forEach((err) => {
      logger.error(`GraphQL Error: ${err.message}`, {
        locations: err.locations,
        path: err.path,
        extensions: err.extensions,
      });
    });
  }

  if (networkError) {
    logger.error('Network Error:', {
      message: networkError.message,
      statusCode,
      result: networkError.result,
      bodyText: networkError.bodyText,
      statusText: networkError.response?.statusText,
    });
  }
};
