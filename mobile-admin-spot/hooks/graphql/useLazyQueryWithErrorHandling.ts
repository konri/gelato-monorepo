import { logGraphQLError } from "@/utils/graphqlErrorLogger";
import type { OperationVariables, TypedDocumentNode } from "@apollo/client";
import {
  type useLazyQuery as useLazyQueryType,
  useLazyQuery as useApolloLazyQuery,
} from "@apollo/client/react";
import type { DocumentNode, OperationDefinitionNode } from "graphql";
import { useEffect, useRef } from "react";

type UseLazyQueryWithErrorHandlingOptions<
  TData = unknown,
  TVariables extends OperationVariables = OperationVariables,
> = useLazyQueryType.Options<TData, TVariables> & {
  operationName?: string;
  onError?: (error: unknown) => void;
};

export const useLazyQueryWithErrorHandling = <
  TData = unknown,
  TVariables extends OperationVariables = OperationVariables,
>(
  query: DocumentNode | TypedDocumentNode<TData, TVariables>,
  options?: UseLazyQueryWithErrorHandlingOptions<TData, TVariables>,
): useLazyQueryType.ResultTuple<TData, TVariables> => {
  const onErrorRef = useRef(options?.onError);
  onErrorRef.current = options?.onError;

  const operationDefinition = query.definitions.find(
    (definition): definition is OperationDefinitionNode =>
      definition.kind === "OperationDefinition",
  );
  const resolvedOperationName =
    options?.operationName || operationDefinition?.name?.value || "Unknown";

  const [executeQuery, result] = useApolloLazyQuery<TData, TVariables>(
    query,
    options,
  );

  useEffect(() => {
    if (!result.error) {
      return;
    }
    logGraphQLError(result.error, resolvedOperationName);
    onErrorRef.current?.(result.error);
  }, [resolvedOperationName, result.error]);

  return [executeQuery, result];
};
