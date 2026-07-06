import {
  GET_COMPANY_BY_NIP_QUERY,
  GetCompanyByNipResponse,
} from "@/shared/api-client/src/graphql/queries/company";
import { useLazyQueryWithErrorHandling } from "../useLazyQueryWithErrorHandling";

type GetCompanyByNipVariables = {
  nip: string;
};

export const useGetCompanyByNip = () => {
  return useLazyQueryWithErrorHandling<GetCompanyByNipResponse, GetCompanyByNipVariables>(
    GET_COMPANY_BY_NIP_QUERY,
    {
      fetchPolicy: "network-only",
      operationName: "GetCompanyByNip",
    }
  );
};
