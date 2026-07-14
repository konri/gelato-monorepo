import { registerEnumType } from 'type-graphql'

export enum CooperatorInvitationPreviewStatus {
  VALID = 'VALID',
  NOT_FOUND = 'NOT_FOUND',
  REVOKED = 'REVOKED',
  ACCEPTED = 'ACCEPTED',
  EXPIRED = 'EXPIRED',
  MERCHANT_NOT_FOUND = 'MERCHANT_NOT_FOUND',
}

registerEnumType(CooperatorInvitationPreviewStatus, {
  name: 'CooperatorInvitationPreviewStatus',
  description: 'Preview status of cooperator invitation',
})
