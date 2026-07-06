import {
  UPSERT_COUPON_STORE_OVERRIDE_MUTATION,
  type UpsertCouponStoreOverrideResponse,
  type UpsertCouponStoreOverrideVariables,
} from "@/shared/api-client/src/graphql/mutations/coupon";
import { useMutationWithErrorHandling } from "../useMutationWithErrorHandling";

export const useUpsertCouponStoreOverride = () => {
  return useMutationWithErrorHandling<
    UpsertCouponStoreOverrideResponse,
    UpsertCouponStoreOverrideVariables
  >(UPSERT_COUPON_STORE_OVERRIDE_MUTATION, {
    operationName: "UpsertCouponStoreOverride",
    refetchQueries: ["GetMyMerchantCoupons"],
    awaitRefetchQueries: true,
  });
};
