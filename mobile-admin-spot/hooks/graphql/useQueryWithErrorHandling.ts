import { isAccessDeniedLikeError } from "@/utils/apolloError";
import { logGraphQLError } from "@/utils/graphqlErrorLogger";
import type { OperationVariables, TypedDocumentNode } from "@apollo/client";
import {
  type useQuery as useQueryType,
  useQuery as useApolloQuery,
} from "@apollo/client/react";
import type { DocumentNode, OperationDefinitionNode } from "graphql";
import { useEffect, useRef } from "react";

type UseQueryWithErrorHandlingOptions<
  TData = unknown,
  TVariables extends OperationVariables = OperationVariables,
> = useQueryType.Options<TData, TVariables> & {
  operationName?: string;
  onError?: (error: unknown) => void;
};

export const useQueryWithErrorHandling = <
  TData = unknown,
  TVariables extends OperationVariables = OperationVariables,
>(
  query: DocumentNode | TypedDocumentNode<TData, TVariables>,
  options: UseQueryWithErrorHandlingOptions<TData, TVariables>,
): useQueryType.Result<TData, TVariables> => {
  const onErrorRef = useRef(options.onError);
  onErrorRef.current = options.onError;

  const operationDefinition = query.definitions.find(
    (definition): definition is OperationDefinitionNode =>
      definition.kind === "OperationDefinition",
  );
  const resolvedOperationName =
    options.operationName || operationDefinition?.name?.value || "Unknown";

  const result = useApolloQuery<TData, TVariables>(query, options);

  useEffect(() => {
    if (!result.error) {
      return;
    }
    if (!isAccessDeniedLikeError(result.error)) {
      logGraphQLError(result.error, resolvedOperationName);
      onErrorRef.current?.(result.error);
    }
  }, [resolvedOperationName, result.error]);

  return result;
};
