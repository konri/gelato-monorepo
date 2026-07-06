import {
    GET_MY_COMPANY_QUERY,
    GetMyCompanyResponse,
} from "@/shared/api-client/src/graphql/queries/company";
import { useQueryWithErrorHandling } from "../useQueryWithErrorHandling";

import { UseQueryOptions } from "./types";

export const useGetMyCompany = (options?: UseQueryOptions) => {
  return useQueryWithErrorHandling<GetMyCompanyResponse>(GET_MY_COMPANY_QUERY, {
    fetchPolicy: "cache-and-network",
    skip: options?.skip,
    operationName: "GetMyCompany",
  });
};
