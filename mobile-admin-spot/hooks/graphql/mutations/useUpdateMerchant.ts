import {
    UPDATE_MERCHANT_MUTATION,
    UpdateMerchantInput,
    UpdateMerchantResponse,
} from "@/shared/api-client/src/graphql/mutations/merchant";
import { GET_MY_MERCHANTS_QUERY } from "@/shared/api-client/src/graphql/queries/myMerchants";
import { useMutationWithErrorHandling } from "../useMutationWithErrorHandling";

export const useUpdateMerchant = () => {
  return useMutationWithErrorHandling<
    UpdateMerchantResponse,
    { data: UpdateMerchantInput; merchantId: string }
  >(UPDATE_MERCHANT_MUTATION, {
    operationName: "UpdateMerchant",
    refetchQueries: [{ query: GET_MY_MERCHANTS_QUERY }],
  });
};

