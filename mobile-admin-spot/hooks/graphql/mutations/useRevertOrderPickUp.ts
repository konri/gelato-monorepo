import {
  REVERT_ORDER_PICK_UP_MUTATION,
  type IdInputMutationVariables,
  type RevertOrderPickUpMutationResponse,
} from "@/shared/api-client/src/graphql/mutations/vendorOrderVendor";
import { useMutationWithErrorHandling } from "../useMutationWithErrorHandling";

export const useRevertOrderPickUp = () => {
  return useMutationWithErrorHandling<
    RevertOrderPickUpMutationResponse,
    IdInputMutationVariables
  >(REVERT_ORDER_PICK_UP_MUTATION, {
    operationName: "RevertOrderPickUp",
  });
};
