import {
  UPDATE_COUPON_MUTATION,
  type UpdateCouponResponse,
  type UpdateCouponVariables,
} from "@/shared/api-client/src/graphql/mutations/coupon";
import { useMutationWithErrorHandling } from "../useMutationWithErrorHandling";

export const useUpdateCoupon = () => {
  return useMutationWithErrorHandling<UpdateCouponResponse, UpdateCouponVariables>(
    UPDATE_COUPON_MUTATION,
    {
      operationName: "UpdateCoupon",
      refetchQueries: ["GetMyMerchantCoupons"],
      awaitRefetchQueries: true,
    },
  );
};
