import {
  MY_COOPERATOR_INVITATIONS_QUERY,
  type CooperatorInvitationStatus,
  type MyCooperatorInvitationsResponse,
} from "@/shared/api-client/src/graphql/queries/cooperatorInvitations";
import { useQueryWithErrorHandling } from "../useQueryWithErrorHandling";

type UseMyCooperatorInvitationsOptions = {
  status?: CooperatorInvitationStatus;
  skip?: boolean;
};

export const useMyCooperatorInvitations = (
  options?: UseMyCooperatorInvitationsOptions,
) => {
  return useQueryWithErrorHandling<
    MyCooperatorInvitationsResponse,
    { status?: CooperatorInvitationStatus }
  >(MY_COOPERATOR_INVITATIONS_QUERY, {
    fetchPolicy: "cache-and-network",
    skip: options?.skip,
    operationName: "MyCooperatorInvitations",
    variables: {
      status: options?.status,
    },
  });
};
