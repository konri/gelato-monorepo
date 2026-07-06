import { registerEnumType } from 'type-graphql'

export enum CooperatorInvitationStatus {
  ACTIVE = 'ACTIVE',
  ACCEPTED = 'ACCEPTED',
  REVOKED = 'REVOKED',
  EXPIRED = 'EXPIRED',
}

registerEnumType(CooperatorInvitationStatus, {
  name: 'CooperatorInvitationStatus',
  description: 'Status of cooperator invitation',
})
