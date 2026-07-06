import {
  CREATE_ORDER_BY_SESSION_MUTATION,
  type CreateOrderBySessionResponse,
  type CreateOrderBySessionVariables,
} from "@/shared/api-client/src/graphql/mutations/createOrderBySession";
import { GET_ACTIVE_ORDERS_QUERY } from "@/shared/api-client/src/graphql/queries/activeOrders";
import { GET_RECENT_CLOSED_ORDERS_QUERY } from "@/shared/api-client/src/graphql/queries/recentClosedOrders";
import {
  type UseMutationWithErrorHandlingOptions,
  useMutationWithErrorHandling,
} from "../useMutationWithErrorHandling";

export const useCreateOrderBySession = (
  merchantStoreId: string,
  options?: Omit<
    UseMutationWithErrorHandlingOptions<
      CreateOrderBySessionResponse,
      CreateOrderBySessionVariables
    >,
    "refetchQueries"
  >,
) => {
  const { context: optionsContext, ...restOptions } = options ?? {};

  return useMutationWithErrorHandling<
    CreateOrderBySessionResponse,
    CreateOrderBySessionVariables
  >(CREATE_ORDER_BY_SESSION_MUTATION, {
    operationName: "CreateOrderBySession",
    context: {
      userNotFoundDoesNotInvalidateSession: true,
      ...optionsContext,
    },
    refetchQueries: [
      {
        query: GET_ACTIVE_ORDERS_QUERY,
        variables: { merchantStoreId },
      },
      {
        query: GET_RECENT_CLOSED_ORDERS_QUERY,
        variables: { merchantStoreId, limit: 50 },
      },
    ],
    ...restOptions,
  });
};
