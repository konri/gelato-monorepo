import {
  SAVE_MERCHANT_POINTS_PROGRAM_MUTATION,
  type SaveMerchantPointsProgramResponse,
  type SaveMerchantPointsProgramVariables,
} from "@/shared/api-client/src/graphql/mutations/merchantPointsProgram";
import { useMutationWithErrorHandling } from "../useMutationWithErrorHandling";

export const useSaveMerchantPointsProgram = () => {
  return useMutationWithErrorHandling<
    SaveMerchantPointsProgramResponse,
    SaveMerchantPointsProgramVariables
  >(SAVE_MERCHANT_POINTS_PROGRAM_MUTATION, {
    operationName: "SaveMerchantPointsProgram",
  });
};
