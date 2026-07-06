import {
  REVERT_ORDER_READY_MUTATION,
  type IdInputMutationVariables,
  type RevertOrderReadyMutationResponse,
} from "@/shared/api-client/src/graphql/mutations/vendorOrderVendor";
import { useMutationWithErrorHandling } from "../useMutationWithErrorHandling";

export const useRevertOrderReady = () => {
  return useMutationWithErrorHandling<
    RevertOrderReadyMutationResponse,
    IdInputMutationVariables
  >(REVERT_ORDER_READY_MUTATION, {
    operationName: "RevertOrderReady",
  });
};
