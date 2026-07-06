import {
  PREVIEW_COOPERATOR_INVITATION_QUERY,
  type PreviewCooperatorInvitationResponse,
} from "@/shared/api-client/src/graphql/queries/cooperatorInvitations";
import { useQueryWithErrorHandling } from "../useQueryWithErrorHandling";

type UsePreviewCooperatorInvitationOptions = {
  token?: string;
  skip?: boolean;
};

export const usePreviewCooperatorInvitation = (
  options?: UsePreviewCooperatorInvitationOptions,
) => {
  return useQueryWithErrorHandling<
    PreviewCooperatorInvitationResponse,
    { token: string }
  >(PREVIEW_COOPERATOR_INVITATION_QUERY, {
    fetchPolicy: "network-only",
    skip: options?.skip || !options?.token,
    operationName: "PreviewCooperatorInvitation",
    variables: {
      token: options?.token ?? "",
    },
  });
};
