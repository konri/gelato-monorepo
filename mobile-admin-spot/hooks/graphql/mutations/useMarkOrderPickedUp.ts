import {
  MARK_ORDER_PICKED_UP_MUTATION,
  type IdInputMutationVariables,
  type MarkOrderPickedUpMutationResponse,
} from "@/shared/api-client/src/graphql/mutations/vendorOrderVendor";
import { useMutationWithErrorHandling } from "../useMutationWithErrorHandling";

export const useMarkOrderPickedUp = () => {
  return useMutationWithErrorHandling<
    MarkOrderPickedUpMutationResponse,
    IdInputMutationVariables
  >(MARK_ORDER_PICKED_UP_MUTATION, {
    operationName: "MarkOrderPickedUp",
  });
};
