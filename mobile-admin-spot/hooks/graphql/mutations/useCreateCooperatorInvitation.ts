import {
  CREATE_COOPERATOR_INVITATION_MUTATION,
  type CreateCooperatorInvitationInput,
  type CreateCooperatorInvitationResponse,
} from "@/shared/api-client/src/graphql/mutations/cooperator";
import { MY_COOPERATOR_INVITATIONS_QUERY } from "@/shared/api-client/src/graphql/queries/cooperatorInvitations";
import { useMutationWithErrorHandling } from "../useMutationWithErrorHandling";

export const useCreateCooperatorInvitation = () => {
  return useMutationWithErrorHandling<
    CreateCooperatorInvitationResponse,
    { data: CreateCooperatorInvitationInput }
  >(CREATE_COOPERATOR_INVITATION_MUTATION, {
    operationName: "CreateCooperatorInvitation",
    awaitRefetchQueries: true,
    refetchQueries: [{ query: MY_COOPERATOR_INVITATIONS_QUERY }],
  });
};
