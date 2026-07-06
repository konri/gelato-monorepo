import {
  REQUEST_TAX_ID_CHANGE_MUTATION,
  RequestTaxIdChangeResponse,
} from "@/shared/api-client/src/graphql/mutations/company/requestTaxIdChange";
import { useMutationWithErrorHandling } from "../useMutationWithErrorHandling";

export const useRequestTaxIdChange = () => {
  return useMutationWithErrorHandling<
    RequestTaxIdChangeResponse,
    Record<string, never>
  >(REQUEST_TAX_ID_CHANGE_MUTATION, {
    operationName: "RequestTaxIdChange",
  });
};
