import {
  MARK_ORDER_READY_MUTATION,
  type IdInputMutationVariables,
  type MarkOrderReadyMutationResponse,
} from "@/shared/api-client/src/graphql/mutations/vendorOrderVendor";
import { useMutationWithErrorHandling } from "../useMutationWithErrorHandling";

export const useMarkOrderReady = () => {
  return useMutationWithErrorHandling<
    MarkOrderReadyMutationResponse,
    IdInputMutationVariables
  >(MARK_ORDER_READY_MUTATION, {
    operationName: "MarkOrderReady",
  });
};
