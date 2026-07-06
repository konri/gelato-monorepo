import {
  DELETE_COOPERATOR_FROM_COMPANY_MUTATION,
  type DeleteCooperatorFromCompanyResponse,
  type DeleteCooperatorFromCompanyVariables,
} from "@/shared/api-client/src/graphql/mutations/cooperator";
import { MY_COOPERATORS_QUERY } from "@/shared/api-client/src/graphql/queries/myCooperators";
import { useMutationWithErrorHandling } from "../useMutationWithErrorHandling";

export const useDeleteCooperatorFromCompany = () => {
  return useMutationWithErrorHandling<
    DeleteCooperatorFromCompanyResponse,
    DeleteCooperatorFromCompanyVariables
  >(DELETE_COOPERATOR_FROM_COMPANY_MUTATION, {
    operationName: "DeleteCooperatorFromCompany",
    awaitRefetchQueries: true,
    refetchQueries: [{ query: MY_COOPERATORS_QUERY }],
  });
};
