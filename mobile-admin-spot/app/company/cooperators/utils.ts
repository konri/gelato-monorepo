import type {
  CooperatorInvitation,
  CooperatorInvitationStatus,
} from "@/shared/api-client/src/graphql/queries/cooperatorInvitations";
import type { AccessConfigState } from "./types";

export const deriveInvitationStatus = (
  invitation: Pick<CooperatorInvitation, "acceptedAt" | "revokedAt" | "expiresAt">,
): CooperatorInvitationStatus => {
  if (invitation.revokedAt) return "REVOKED";
  if (invitation.acceptedAt) return "ACCEPTED";
  if (
    !invitation.expiresAt ||
    new Date(invitation.expiresAt).getTime() < Date.now()
  ) {
    return "EXPIRED";
  }
  return "ACTIVE";
};

export const buildStoreIds = (config: AccessConfigState) =>
  config.scopeMode === "STORE_SCOPED" && !config.storeScopeAll
    ? config.selectedStoreIds
    : undefined;
