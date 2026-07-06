import {
  GET_MY_MERCHANT_COUPONS_QUERY,
  type GetMyMerchantCouponsResponse,
  type GetMyMerchantCouponsVariables,
} from "@/shared/api-client/src/graphql/queries/myMerchantCoupons";
import type { Coupon } from "@/shared/api-client/src/graphql/mutations/coupon";
import { useOperatorAccess } from "@/hooks/useOperatorAccess";
import { useMemo } from "react";
import { useQueryWithErrorHandling } from "../useQueryWithErrorHandling";
import { UseQueryOptions } from "./types";

type UseGetMyMerchantCouponsOptions = UseQueryOptions & {
  storeId?: string | null;
};

export const useGetMyMerchantCoupons = (options?: UseGetMyMerchantCouponsOptions) => {
  const { selectedStoreId } = useOperatorAccess();
  const effectiveStoreId =
    options?.storeId !== undefined ? options.storeId : selectedStoreId;
  const variables: GetMyMerchantCouponsVariables | undefined = effectiveStoreId
    ? { storeId: effectiveStoreId }
    : undefined;
  const queryResult = useQueryWithErrorHandling<
    GetMyMerchantCouponsResponse,
    GetMyMerchantCouponsVariables
  >(
    GET_MY_MERCHANT_COUPONS_QUERY,
    {
      fetchPolicy: "cache-and-network",
      skip: options?.skip,
      operationName: "GetMyMerchantCoupons",
      variables,
    },
  );

  const merchantCoupons = useMemo<Coupon[]>(
    () =>
      queryResult.dataState === "complete"
        ? queryResult.data?.myMerchantCoupons ?? []
        : [],
    [queryResult.data?.myMerchantCoupons, queryResult.dataState],
  );

  return {
    ...queryResult,
    merchantCoupons,
  };
};
