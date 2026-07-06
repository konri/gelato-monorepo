import { logGraphQLError } from "@/utils/graphqlErrorLogger";
import type { OperationVariables, TypedDocumentNode } from "@apollo/client";
import {
  type useMutation as useMutationType,
  useMutation as useApolloMutation,
} from "@apollo/client/react";
import type { DocumentNode, OperationDefinitionNode } from "graphql";
import { useRef } from "react";

export type UseMutationWithErrorHandlingOptions<
  TData = unknown,
  TVariables extends OperationVariables = OperationVariables,
> = Omit<useMutationType.Options<TData, TVariables>, "onError"> & {
  operationName?: string;
  onError?: (error: unknown) => void;
};

const getOperationName = (
  document: DocumentNode | TypedDocumentNode<unknown, OperationVariables>,
): string | undefined => {
  const operationDefinition = document.definitions.find(
    (definition): definition is OperationDefinitionNode =>
      definition.kind === "OperationDefinition",
  );

  return operationDefinition?.name?.value;
};

export const useMutationWithErrorHandling = <
  TData = unknown,
  TVariables extends OperationVariables = OperationVariables,
>(
  mutation: DocumentNode | TypedDocumentNode<TData, TVariables>,
  options?: UseMutationWithErrorHandlingOptions<TData, TVariables>,
) => {
  const { operationName, onError, ...restOptions } = options || {};
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  const resolvedOperationName =
    operationName || getOperationName(mutation) || "Unknown";

  const [mutate, result] = useApolloMutation<TData, TVariables>(
    mutation,
    restOptions,
  );

  const mutateWithErrorHandling = async (
    ...args: Parameters<typeof mutate>
  ): ReturnType<typeof mutate> => {
    try {
      return await mutate(...args);
    } catch (error) {
      logGraphQLError(error, resolvedOperationName);
      onErrorRef.current?.(error);

      throw error;
    }
  };

  return [mutateWithErrorHandling, result] as const;
};
