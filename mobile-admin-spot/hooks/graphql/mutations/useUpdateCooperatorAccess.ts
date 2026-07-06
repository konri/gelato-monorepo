import {
  UPDATE_COOPERATOR_ACCESS_MUTATION,
  type UpdateCooperatorAccessInput,
  type UpdateCooperatorAccessResponse,
} from "@/shared/api-client/src/graphql/mutations/cooperator";
import { MY_COOPERATOR_INVITATIONS_QUERY } from "@/shared/api-client/src/graphql/queries/cooperatorInvitations";
import { MY_COOPERATORS_QUERY } from "@/shared/api-client/src/graphql/queries/myCooperators";
import { useMutationWithErrorHandling } from "../useMutationWithErrorHandling";

export const useUpdateCooperatorAccess = () => {
  return useMutationWithErrorHandling<
    UpdateCooperatorAccessResponse,
    { data: UpdateCooperatorAccessInput }
  >(UPDATE_COOPERATOR_ACCESS_MUTATION, {
    operationName: "UpdateCooperatorAccess",
    awaitRefetchQueries: true,
    refetchQueries: [
      { query: MY_COOPERATOR_INVITATIONS_QUERY },
      { query: MY_COOPERATORS_QUERY },
    ],
  });
};
