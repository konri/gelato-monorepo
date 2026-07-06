import {
  ACCEPT_COOPERATOR_INVITATION_MUTATION,
  type AcceptCooperatorInvitationResponse,
} from "@/shared/api-client/src/graphql/mutations/cooperator";
import { useMutationWithErrorHandling } from "../useMutationWithErrorHandling";

export const useAcceptCooperatorInvitation = () => {
  return useMutationWithErrorHandling<
    AcceptCooperatorInvitationResponse,
    { token: string }
  >(ACCEPT_COOPERATOR_INVITATION_MUTATION, {
    operationName: "AcceptCooperatorInvitation",
  });
};
