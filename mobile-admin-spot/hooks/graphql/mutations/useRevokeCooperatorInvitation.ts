import {
  REVOKE_COOPERATOR_INVITATION_MUTATION,
  type RevokeCooperatorInvitationResponse,
} from "@/shared/api-client/src/graphql/mutations/cooperator";
import { MY_COOPERATOR_INVITATIONS_QUERY } from "@/shared/api-client/src/graphql/queries/cooperatorInvitations";
import { useMutationWithErrorHandling } from "../useMutationWithErrorHandling";

export const useRevokeCooperatorInvitation = () => {
  return useMutationWithErrorHandling<
    RevokeCooperatorInvitationResponse,
    { invitationId: string }
  >(REVOKE_COOPERATOR_INVITATION_MUTATION, {
    operationName: "RevokeCooperatorInvitation",
    awaitRefetchQueries: true,
    refetchQueries: [{ query: MY_COOPERATOR_INVITATIONS_QUERY }],
  });
};
