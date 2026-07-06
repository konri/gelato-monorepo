import {
  CREATE_MERCHANT_STORE_MUTATION,
  CreateMerchantStoreInput,
  CreateMerchantStoreResponse,
} from "@/shared/api-client/src/graphql/mutations/merchantStore";
import { GET_MERCHANT_STORES_QUERY } from "@/shared/api-client/src/graphql/queries/merchantStores";
import { GET_PROFILE_SETUP_STATUS_QUERY } from "@/shared/api-client/src/graphql/queries/profileSetupStatus";
import { useMutationWithErrorHandling } from "../useMutationWithErrorHandling";

export const useCreateMerchantStore = () => {
  return useMutationWithErrorHandling<
    CreateMerchantStoreResponse,
    { data: CreateMerchantStoreInput; merchantId: string }
  >(CREATE_MERCHANT_STORE_MUTATION, {
    operationName: "CreateMerchantStore",
    refetchQueries: [
      { query: GET_MERCHANT_STORES_QUERY },
      { query: GET_PROFILE_SETUP_STATUS_QUERY },
    ],
    awaitRefetchQueries: false,
  });
};

