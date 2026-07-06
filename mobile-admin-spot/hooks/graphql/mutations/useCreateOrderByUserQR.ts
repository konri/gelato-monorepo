import {
  CREATE_ORDER_BY_USER_QR_MUTATION,
  type CreateOrderByUserQRResponse,
  type CreateOrderByUserQRVariables,
} from "@/shared/api-client/src/graphql/mutations/createOrderByUserQR";
import { GET_ACTIVE_ORDERS_QUERY } from "@/shared/api-client/src/graphql/queries/activeOrders";
import { GET_RECENT_CLOSED_ORDERS_QUERY } from "@/shared/api-client/src/graphql/queries/recentClosedOrders";
import {
  type UseMutationWithErrorHandlingOptions,
  useMutationWithErrorHandling,
} from "../useMutationWithErrorHandling";

export const useCreateOrderByUserQR = (
  merchantStoreId: string,
  options?: Omit<
    UseMutationWithErrorHandlingOptions<
      CreateOrderByUserQRResponse,
      CreateOrderByUserQRVariables
    >,
    "refetchQueries"
  >,
) => {
  const { context: optionsContext, ...restOptions } = options ?? {};

  return useMutationWithErrorHandling<
    CreateOrderByUserQRResponse,
    CreateOrderByUserQRVariables
  >(CREATE_ORDER_BY_USER_QR_MUTATION, {
    operationName: "CreateOrderByUserQR",
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
