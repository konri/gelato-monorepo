import {
    DELETE_MERCHANT_STORE_MUTATION,
    DeleteMerchantStoreResponse,
} from "@/shared/api-client/src/graphql/mutations/merchantStore";
import { GET_MERCHANT_STORES_QUERY } from "@/shared/api-client/src/graphql/queries/merchantStores";
import { useMutationWithErrorHandling } from "../useMutationWithErrorHandling";

export const useDeleteMerchantStore = () => {
  return useMutationWithErrorHandling<DeleteMerchantStoreResponse, { storeId: string }>(
    DELETE_MERCHANT_STORE_MUTATION,
    {
      operationName: "DeleteMerchantStore",
      refetchQueries: [{ query: GET_MERCHANT_STORES_QUERY }],
    }
  );
};

