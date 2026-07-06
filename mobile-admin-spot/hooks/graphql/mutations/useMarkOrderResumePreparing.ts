import {
  MARK_ORDER_RESUME_PREPARING_MUTATION,
  type IdInputMutationVariables,
  type MarkOrderResumePreparingMutationResponse,
} from "@/shared/api-client/src/graphql/mutations/vendorOrderVendor";
import { useMutationWithErrorHandling } from "../useMutationWithErrorHandling";

export const useMarkOrderResumePreparing = () => {
  return useMutationWithErrorHandling<
    MarkOrderResumePreparingMutationResponse,
    IdInputMutationVariables
  >(MARK_ORDER_RESUME_PREPARING_MUTATION, {
    operationName: "MarkOrderResumePreparing",
  });
};
