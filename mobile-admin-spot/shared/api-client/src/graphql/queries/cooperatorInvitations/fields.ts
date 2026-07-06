export const COOPERATOR_ACCESS_FIELDS = `
  scopeMode
  permissions
  storeScopeAll
  storeIds
`;

export const COOPERATOR_INVITATION_FIELDS = `
  id
  email
  ${COOPERATOR_ACCESS_FIELDS}
  expiresAt
  acceptedAt
  revokedAt
  createdAt
`;
