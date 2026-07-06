import {
  MARK_ORDER_DELAYED_MUTATION,
  type IdInputMutationVariables,
  type MarkOrderDelayedMutationResponse,
} from "@/shared/api-client/src/graphql/mutations/vendorOrderVendor";
import { useMutationWithErrorHandling } from "../useMutationWithErrorHandling";

export const useMarkOrderDelayed = () => {
  return useMutationWithErrorHandling<
    MarkOrderDelayedMutationResponse,
    IdInputMutationVariables
  >(MARK_ORDER_DELAYED_MUTATION, {
    operationName: "MarkOrderDelayed",
  });
};
