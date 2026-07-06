import {
    CREATE_MERCHANT_MUTATION,
    CreateMerchantInput,
    CreateMerchantResponse,
} from "@/shared/api-client/src/graphql/mutations/merchantRequest";
import { GET_MY_MERCHANTS_QUERY } from "@/shared/api-client/src/graphql/queries/myMerchants";
import { MY_OPERATOR_CAPABILITIES_QUERY } from "@/shared/api-client/src/graphql/queries/operatorCapabilities";
import { GET_PROFILE_SETUP_STATUS_QUERY } from "@/shared/api-client/src/graphql/queries/profileSetupStatus";
import { useMutationWithErrorHandling } from "../useMutationWithErrorHandling";

export const useCreateMerchant = () => {
  return useMutationWithErrorHandling<CreateMerchantResponse, { data: CreateMerchantInput }>(
    CREATE_MERCHANT_MUTATION,
    {
      operationName: "CreateMerchant",
      refetchQueries: [
        { query: GET_MY_MERCHANTS_QUERY },
        { query: MY_OPERATOR_CAPABILITIES_QUERY },
        { query: GET_PROFILE_SETUP_STATUS_QUERY },
      ],
      awaitRefetchQueries: false,
    }
  );
};

