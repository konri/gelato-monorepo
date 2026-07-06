import {
  ADD_MERCHANT_POINTS_MUTATION,
  type AddMerchantPointsResponse,
  type AddMerchantPointsVariables,
} from "@/shared/api-client/src/graphql/mutations/merchantPointsProgram";
import { useMutationWithErrorHandling } from "../useMutationWithErrorHandling";

export const useAddMerchantPoints = () => {
  return useMutationWithErrorHandling<
    AddMerchantPointsResponse,
    AddMerchantPointsVariables
  >(ADD_MERCHANT_POINTS_MUTATION, {
    operationName: "AddMerchantPoints",
  });
};
