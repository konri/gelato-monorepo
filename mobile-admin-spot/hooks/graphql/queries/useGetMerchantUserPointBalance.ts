import {
  MERCHANT_USER_POINT_BALANCE_QUERY,
  type MerchantUserPointBalanceResponse,
} from "@/shared/api-client/src/graphql/queries/merchantPointsProgram";
import { useQueryWithErrorHandling } from "../useQueryWithErrorHandling";

type UseGetMerchantUserPointBalanceOptions = {
  userId: string;
  merchantId: string;
  skip?: boolean;
};

export const useGetMerchantUserPointBalance = ({
  userId,
  merchantId,
  skip = false,
}: UseGetMerchantUserPointBalanceOptions) => {
  return useQueryWithErrorHandling<
    MerchantUserPointBalanceResponse,
    { userId: string; merchantId: string }
  >(MERCHANT_USER_POINT_BALANCE_QUERY, {
    operationName: "MerchantUserPointBalance",
    fetchPolicy: "network-only",
    variables: { userId, merchantId },
    skip: skip || !userId || !merchantId,
  });
};
