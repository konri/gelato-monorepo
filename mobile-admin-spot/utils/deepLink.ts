export const PENDING_COOPERATOR_INVITATION_TOKEN_KEY =
  "pendingCooperatorInvitationToken";

export const extractDeepLinkToken = (
  params: Record<string, string | string[] | null | undefined>,
): string | undefined => {
  const candidate = params.token ?? params.invitationToken ?? params.inviteToken;
  if (Array.isArray(candidate)) {
    return candidate[0];
  }
  return candidate ?? undefined;
};

export const isCooperatorDeepLink = (path: string): boolean =>
  path.includes("cooperator") || path.includes("invitation");
