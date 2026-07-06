import {
  GET_MERCHANT_POINTS_PROGRAM_QUERY,
  type GetMerchantPointsProgramResponse,
  type GetMerchantPointsProgramVariables,
} from "@/shared/api-client/src/graphql/queries/merchantPointsProgram";
import { useQueryWithErrorHandling } from "../useQueryWithErrorHandling";

type UseGetMerchantPointsProgramOptions = {
  merchantId?: string;
  skip?: boolean;
};

export const useGetMerchantPointsProgram = (
  options?: UseGetMerchantPointsProgramOptions,
) => {
  const merchantId = options?.merchantId;
  const shouldSkip = Boolean(options?.skip) || !merchantId;
  const variables: GetMerchantPointsProgramVariables = {
    merchantId: merchantId ?? "",
  };

  return useQueryWithErrorHandling<
    GetMerchantPointsProgramResponse,
    GetMerchantPointsProgramVariables
  >(GET_MERCHANT_POINTS_PROGRAM_QUERY, {
    fetchPolicy: "cache-and-network",
    skip: shouldSkip,
    variables,
    operationName: "GetMerchantPointsProgram",
  });
};
