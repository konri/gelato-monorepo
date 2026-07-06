import {
    UPDATE_MERCHANT_STORE_MUTATION,
    UpdateMerchantStoreInput,
    UpdateMerchantStoreResponse,
} from "@/shared/api-client/src/graphql/mutations/merchantStore";
import { GET_MERCHANT_STORES_QUERY } from "@/shared/api-client/src/graphql/queries/merchantStores";
import { useMutationWithErrorHandling } from "../useMutationWithErrorHandling";

export const useUpdateMerchantStore = () => {
  return useMutationWithErrorHandling<
    UpdateMerchantStoreResponse,
    { data: UpdateMerchantStoreInput; storeId: string }
  >(UPDATE_MERCHANT_STORE_MUTATION, {
    operationName: "UpdateMerchantStore",
    refetchQueries: [{ query: GET_MERCHANT_STORES_QUERY }],
  });
};

