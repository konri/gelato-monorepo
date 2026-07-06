import {
    CREATE_MERCHANT_MUTATION,
    CreateMerchantInput,
    CreateMerchantResponse,
} from "@/shared/api-client/src/graphql/mutations/merchantRequest";
import { GET_MY_MERCHANTS_QUERY } from "@/shared/api-client/src/graphql/queries/myMerchants";
import { useMutationWithErrorHandling } from "../useMutationWithErrorHandling";

export const useCreateMerchant = () => {
  return useMutationWithErrorHandling<CreateMerchantResponse, { data: CreateMerchantInput }>(
    CREATE_MERCHANT_MUTATION,
    {
      operationName: "RequestMerchant",
      refetchQueries: [{ query: GET_MY_MERCHANTS_QUERY }],
    }
  );
};
