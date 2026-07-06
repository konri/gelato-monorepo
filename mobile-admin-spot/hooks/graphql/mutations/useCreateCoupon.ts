import {
  CREATE_COUPON_MUTATION,
  type CreateCouponResponse,
  type CreateCouponVariables,
} from "@/shared/api-client/src/graphql/mutations/coupon";
import { useMutationWithErrorHandling } from "../useMutationWithErrorHandling";

export const useCreateCoupon = () => {
  return useMutationWithErrorHandling<CreateCouponResponse, CreateCouponVariables>(
    CREATE_COUPON_MUTATION,
    {
      operationName: "CreateCoupon",
      refetchQueries: ["GetMyMerchantCoupons"],
      awaitRefetchQueries: true,
    },
  );
};
