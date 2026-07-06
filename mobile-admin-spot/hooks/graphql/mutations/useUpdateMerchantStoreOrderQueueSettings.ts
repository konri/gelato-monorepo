import {
  UPDATE_MERCHANT_STORE_ORDER_QUEUE_SETTINGS_MUTATION,
  type UpdateMerchantStoreOrderQueueSettingsResponse,
  type UpdateMerchantStoreOrderQueueSettingsVariables,
} from "@/shared/api-client/src/graphql/mutations/merchantStoreOrderQueue";
import { GET_MERCHANT_STORES_QUERY } from "@/shared/api-client/src/graphql/queries/merchantStores";
import { useMutationWithErrorHandling } from "../useMutationWithErrorHandling";

export const useUpdateMerchantStoreOrderQueueSettings = () => {
  return useMutationWithErrorHandling<
    UpdateMerchantStoreOrderQueueSettingsResponse,
    UpdateMerchantStoreOrderQueueSettingsVariables
  >(UPDATE_MERCHANT_STORE_ORDER_QUEUE_SETTINGS_MUTATION, {
    operationName: "UpdateMerchantStoreOrderQueueSettings",
    refetchQueries: [{ query: GET_MERCHANT_STORES_QUERY }],
  });
};
