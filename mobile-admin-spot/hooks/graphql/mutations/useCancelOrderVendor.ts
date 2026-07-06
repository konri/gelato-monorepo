import {
  CANCEL_ORDER_MUTATION,
  type CancelOrderVendorMutationResponse,
  type IdInputMutationVariables,
} from "@/shared/api-client/src/graphql/mutations/vendorOrderVendor";
import { useMutationWithErrorHandling } from "../useMutationWithErrorHandling";

export const useCancelOrderVendor = () => {
  return useMutationWithErrorHandling<
    CancelOrderVendorMutationResponse,
    IdInputMutationVariables
  >(CANCEL_ORDER_MUTATION, {
    operationName: "CancelOrderVendor",
  });
};
