import { CompanyInput } from "@/shared/api-client/src/graphql/mutations/company";
import {
    UPDATE_COMPANY_MUTATION,
    UpdateCompanyResponse,
} from "@/shared/api-client/src/graphql/mutations/company/updateCompany";
import { GET_MY_COMPANY_QUERY } from "@/shared/api-client/src/graphql/queries/company";
import { useMutationWithErrorHandling } from "../useMutationWithErrorHandling";

type UpdateCompanyVariables = {
  data: CompanyInput;
};

export const useUpdateCompany = () => {
  return useMutationWithErrorHandling<UpdateCompanyResponse, UpdateCompanyVariables>(
    UPDATE_COMPANY_MUTATION,
    {
      operationName: "UpdateCompany",
      refetchQueries: [{ query: GET_MY_COMPANY_QUERY }],
    }
  );
};
