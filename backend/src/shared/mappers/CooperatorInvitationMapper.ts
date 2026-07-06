import { CooperatorInvitation, CooperatorInvitationPreview } from '../../Cooperator/objectType/CooperatorInvitation'
import {
  CooperatorInvitationGraphQLPayload,
  CooperatorInvitationPreviewGraphQLPayload,
} from '../../Cooperator/service/CooperatorInvitationService'

export class CooperatorInvitationMapper {
  static toGraphQL(invitation: CooperatorInvitationGraphQLPayload): CooperatorInvitation {
    return {
      id: invitation.id,
      email: invitation.email,
      scopeMode: invitation.scopeMode,
      permissions: invitation.permissions,
      storeScopeAll: invitation.storeScopeAll,
      storeIds: invitation.storeIds,
      companyOwnerId: invitation.companyOwnerId,
      merchantId: invitation.merchantId,
      expiresAt: invitation.expiresAt,
      acceptedAt: invitation.acceptedAt,
      revokedAt: invitation.revokedAt,
      createdAt: invitation.createdAt,
      updatedAt: invitation.updatedAt,
    }
  }

  static toGraphQLArray(invitations: CooperatorInvitationGraphQLPayload[]): CooperatorInvitation[] {
    return invitations.map((invitation) => this.toGraphQL(invitation))
  }

  static toPreview(preview: CooperatorInvitationPreviewGraphQLPayload): CooperatorInvitationPreview {
    return {
      valid: preview.valid,
      status: preview.status,
      email: preview.email,
      merchantId: preview.merchantId,
      merchantName: preview.merchantName,
      scopeMode: preview.scopeMode,
      permissions: preview.permissions,
      storeScopeAll: preview.storeScopeAll,
      storeIds: preview.storeIds,
      expiresAt: preview.expiresAt,
    }
  }
}
