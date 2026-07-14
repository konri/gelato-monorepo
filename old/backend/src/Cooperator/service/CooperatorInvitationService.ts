import crypto from 'crypto'
import { OperatorPermission, OperatorScopeMode, PrismaClient, Role } from '@prisma/client'
import { ErrorWithStatus } from '../../shared/interface/ErrorWithStatus'
import { sendEmail } from '../../shared/service/emailGeneration.service'
import { MerchantAccessService } from '../../shared/service/MerchantAccessService'
import { generateJWT } from '../../Auth/PasswordUtil'
import { CooperatorInvitationPreviewStatus } from '../objectType/CooperatorInvitationPreviewStatus'

type CreateInvitationInput = {
  ownerUserId: string
  email: string
  scopeMode: OperatorScopeMode
  permissions: OperatorPermission[]
  storeScopeAll: boolean
  storeIds?: string[]
  expiresInHours?: number
}

type AcceptInvitationInput = {
  token: string
  userId: string
}

type StoreAccessLike = {
  merchantStoreId: string
}

type InvitationRecordLike = {
  id: string
  email: string
  scopeMode: OperatorScopeMode
  permissions: OperatorPermission[]
  storeScopeAll: boolean
  companyOwnerId: string
  merchantId: string | null
  expiresAt: Date
  acceptedAt: Date | null
  revokedAt: Date | null
  createdAt: Date
  updatedAt: Date
  storeAccesses?: StoreAccessLike[]
}

export type CooperatorInvitationGraphQLPayload = {
  id: string
  email: string
  scopeMode: OperatorScopeMode
  permissions: OperatorPermission[]
  storeScopeAll: boolean
  storeIds: string[]
  companyOwnerId: string
  merchantId?: string
  expiresAt: Date
  acceptedAt?: Date
  revokedAt?: Date
  createdAt: Date
  updatedAt: Date
}

export type InvitationPayload = {
  merchantId: string
  merchantName: string
  scopeMode: OperatorScopeMode
  permissions: OperatorPermission[]
  storeScopeAll: boolean
  storeIds: string[]
  expiresAt: Date
  email: string
}

export type CooperatorInvitationPreviewGraphQLPayload = Partial<InvitationPayload> & {
  valid: boolean
  status: CooperatorInvitationPreviewStatus
}

export class CooperatorInvitationService {
  constructor(private prisma: PrismaClient) {}

  private static hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex')
  }

  private static normalizeEmail(email: string): string {
    return email.trim().toLowerCase()
  }

  private static normalizeComparableEmail(email: string): string {
    return CooperatorInvitationService.normalizeEmail(email).replace(/-google$|-facebook$/, '')
  }

  private static generateToken(): string {
    return crypto.randomBytes(32).toString('hex')
  }

  static toGraphQLInvitation(invitation: InvitationRecordLike): CooperatorInvitationGraphQLPayload {
    const storeScopeAll = invitation.scopeMode === OperatorScopeMode.FULL_MERCHANT ? true : invitation.storeScopeAll
    const storeIds =
      invitation.scopeMode === OperatorScopeMode.STORE_SCOPED && !storeScopeAll
        ? (invitation.storeAccesses ?? []).map((item) => item.merchantStoreId)
        : []

    return {
      id: invitation.id,
      email: invitation.email,
      scopeMode: invitation.scopeMode,
      permissions: invitation.permissions,
      storeScopeAll,
      storeIds,
      companyOwnerId: invitation.companyOwnerId,
      merchantId: invitation.merchantId ?? undefined,
      expiresAt: invitation.expiresAt,
      acceptedAt: invitation.acceptedAt ?? undefined,
      revokedAt: invitation.revokedAt ?? undefined,
      createdAt: invitation.createdAt,
      updatedAt: invitation.updatedAt,
    }
  }

  static toGraphQLInvitations(invitations: InvitationRecordLike[]): CooperatorInvitationGraphQLPayload[] {
    return invitations.map((invitation) => this.toGraphQLInvitation(invitation))
  }

  static toGraphQLPreview(
    preview: InvitationPayload | null,
    status: CooperatorInvitationPreviewStatus
  ): CooperatorInvitationPreviewGraphQLPayload {
    if (!preview) {
      return {
        valid: false,
        status,
      }
    }

    return {
      valid: status === CooperatorInvitationPreviewStatus.VALID,
      status,
      ...preview,
    }
  }

  private async resolveOwnerContext(ownerUserId: string) {
    const owner = await this.prisma.companyOwner.findFirst({
      where: { userId: ownerUserId },
      include: {
        company: {
          include: {
            merchant: true,
          },
        },
      },
    })

    if (!owner) {
      throw new ErrorWithStatus(404, 'Company owner not found')
    }

    const merchant = owner.company?.merchant
    if (!merchant?.id) {
      throw new ErrorWithStatus(404, 'Merchant not found for company owner')
    }

    return { owner, merchant }
  }

  private async validateStoreScope(merchantId: string, storeScopeAll: boolean, storeIds: string[]) {
    if (storeScopeAll) {
      return
    }

    if (storeIds.length < 1) {
      throw new ErrorWithStatus(400, 'At least one storeId is required for scoped access')
    }

    const storesCount = await this.prisma.merchantStore.count({
      where: {
        merchantId,
        id: { in: storeIds },
      },
    })

    if (storesCount !== storeIds.length) {
      throw new ErrorWithStatus(400, 'One or more storeIds are invalid for this merchant')
    }
  }

  private buildWebUrl(token: string): string {
    const baseUrl = process.env.FRONT_END_MERCHANT_URL || process.env.FRONT_END_APP_URL
    if (!baseUrl) {
      return ''
    }
    return `${baseUrl.replace(/\/$/, '')}/pl/cooperator-invitation/${encodeURIComponent(token)}`
  }

  private buildDeeplinkUrl(token: string): string {
    return `bonapka.merchant://cooperator-invitation?token=${encodeURIComponent(token)}`
  }

  async createInvitation(input: CreateInvitationInput) {
    const normalizedEmail = CooperatorInvitationService.normalizeEmail(input.email)
    const scopeMode = input.scopeMode
    const permissions = MerchantAccessService.normalizePermissions(input.permissions)
    if (permissions.length < 1) {
      throw new ErrorWithStatus(400, 'At least one permission must be selected')
    }
    const storeScopeAll = scopeMode === OperatorScopeMode.FULL_MERCHANT ? true : input.storeScopeAll
    const storeIds =
      scopeMode === OperatorScopeMode.STORE_SCOPED && !storeScopeAll ? [...new Set(input.storeIds || [])] : []
    const { owner, merchant } = await this.resolveOwnerContext(input.ownerUserId)
    await this.validateStoreScope(merchant.id, storeScopeAll, storeIds)

    const expiresInHours = input.expiresInHours && input.expiresInHours > 0 ? input.expiresInHours : 72
    const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000)
    const token = CooperatorInvitationService.generateToken()
    const tokenHash = CooperatorInvitationService.hashToken(token)

    const invitation = await this.prisma.cooperatorInvitation.create({
      data: {
        email: normalizedEmail,
        tokenHash,
        expiresAt,
        scopeMode,
        permissions,
        storeScopeAll,
        companyOwnerId: owner.id,
        merchantId: merchant.id,
        createdByUserId: input.ownerUserId,
        storeAccesses: storeScopeAll
          ? undefined
          : {
              create: storeIds.map((storeId) => ({
                merchantStoreId: storeId,
              })),
            },
      },
      include: {
        storeAccesses: true,
      },
    })

    const webUrl = this.buildWebUrl(token)
    const deeplinkUrl = this.buildDeeplinkUrl(token)

    const templateVars = {
      merchant_name: merchant.name,
      web_url: webUrl,
      deeplink_url: deeplinkUrl,
      access_level: scopeMode,
      scope_mode: scopeMode,
      permissions: permissions.join(','),
      expires_at: expiresAt.toISOString(),
    }

    await sendEmail('cooperator-invitation', templateVars, normalizedEmail, 'cooperatorInvitation', 'pl')

    return {
      invitation,
      token,
      webUrl,
      deeplinkUrl,
      storeIds: invitation.storeAccesses.map((item) => item.merchantStoreId),
    }
  }

  async listOwnerInvitations(ownerUserId: string, status?: 'ACTIVE' | 'ACCEPTED' | 'REVOKED' | 'EXPIRED') {
    const { owner } = await this.resolveOwnerContext(ownerUserId)
    const now = new Date()

    const where: any = {
      companyOwnerId: owner.id,
    }

    if (status === 'ACTIVE') {
      where.acceptedAt = null
      where.revokedAt = null
      where.expiresAt = { gt: now }
    } else if (status === 'ACCEPTED') {
      where.acceptedAt = { not: null }
    } else if (status === 'REVOKED') {
      where.revokedAt = { not: null }
    } else if (status === 'EXPIRED') {
      where.acceptedAt = null
      where.revokedAt = null
      where.expiresAt = { lte: now }
    }

    return this.prisma.cooperatorInvitation.findMany({
      where,
      include: {
        storeAccesses: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
  }

  async revokeInvitation(ownerUserId: string, invitationId: string) {
    const { owner } = await this.resolveOwnerContext(ownerUserId)
    const invitation = await this.prisma.cooperatorInvitation.findFirst({
      where: {
        id: invitationId,
        companyOwnerId: owner.id,
      },
    })

    if (!invitation) {
      throw new ErrorWithStatus(404, 'Invitation not found')
    }

    if (invitation.acceptedAt) {
      throw new ErrorWithStatus(409, 'Invitation already accepted')
    }

    return this.prisma.cooperatorInvitation.update({
      where: { id: invitation.id },
      data: {
        revokedAt: new Date(),
      },
    })
  }

  private async getInvitationByToken(token: string) {
    const invitation = await this.findInvitationByToken(token)

    if (!invitation) {
      throw new ErrorWithStatus(404, 'Invitation not found')
    }

    return invitation
  }

  private async findInvitationByToken(token: string) {
    const tokenHash = CooperatorInvitationService.hashToken(token)
    return this.prisma.cooperatorInvitation.findUnique({
      where: { tokenHash },
      include: {
        storeAccesses: true,
        merchant: true,
      },
    })
  }

  async previewInvitation(token: string): Promise<CooperatorInvitationPreviewGraphQLPayload> {
    const invitation = await this.findInvitationByToken(token)

    if (!invitation) {
      return CooperatorInvitationService.toGraphQLPreview(null, CooperatorInvitationPreviewStatus.NOT_FOUND)
    }

    if (!invitation.merchant?.id) {
      return CooperatorInvitationService.toGraphQLPreview(null, CooperatorInvitationPreviewStatus.MERCHANT_NOT_FOUND)
    }

    if (invitation.revokedAt) {
      return CooperatorInvitationService.toGraphQLPreview(null, CooperatorInvitationPreviewStatus.REVOKED)
    }

    if (invitation.acceptedAt) {
      return CooperatorInvitationService.toGraphQLPreview(null, CooperatorInvitationPreviewStatus.ACCEPTED)
    }

    if (invitation.expiresAt <= new Date()) {
      return CooperatorInvitationService.toGraphQLPreview(null, CooperatorInvitationPreviewStatus.EXPIRED)
    }

    const scopeMode = invitation.scopeMode
    const permissions = MerchantAccessService.normalizePermissions(invitation.permissions)
    const storeScopeAll = scopeMode === OperatorScopeMode.FULL_MERCHANT ? true : invitation.storeScopeAll
    const storeIds =
      scopeMode === OperatorScopeMode.STORE_SCOPED && !storeScopeAll
        ? invitation.storeAccesses.map((item) => item.merchantStoreId)
        : []

    return CooperatorInvitationService.toGraphQLPreview(
      {
        merchantId: invitation.merchant.id,
        merchantName: invitation.merchant.name,
        scopeMode,
        permissions,
        storeScopeAll,
        storeIds,
        expiresAt: invitation.expiresAt,
        email: invitation.email,
      },
      CooperatorInvitationPreviewStatus.VALID
    )
  }

  async acceptInvitation(input: AcceptInvitationInput) {
    const invitation = await this.getInvitationByToken(input.token)
    const user = await this.prisma.user.findUnique({
      where: { id: input.userId },
    })

    if (!user) {
      throw new ErrorWithStatus(404, 'User not found')
    }

    if (invitation.revokedAt) {
      throw new ErrorWithStatus(409, 'Invitation revoked')
    }

    if (invitation.acceptedAt) {
      throw new ErrorWithStatus(409, 'Invitation already accepted')
    }

    if (invitation.expiresAt <= new Date()) {
      throw new ErrorWithStatus(410, 'Invitation expired')
    }

    const comparableInvitationEmail = CooperatorInvitationService.normalizeComparableEmail(invitation.email)
    const comparableUserEmail = CooperatorInvitationService.normalizeComparableEmail(user.email)
    if (comparableInvitationEmail !== comparableUserEmail) {
      throw new ErrorWithStatus(403, 'Invitation email does not match logged user')
    }

    if (!invitation.merchantId) {
      throw new ErrorWithStatus(404, 'Merchant not found for invitation')
    }

    const owner = await this.prisma.companyOwner.findUnique({
      where: { id: invitation.companyOwnerId },
      include: {
        company: {
          include: {
            merchant: true,
          },
        },
      },
    })

    if (!owner?.company?.merchant?.id) {
      throw new ErrorWithStatus(404, 'Owner merchant not found')
    }

    const cooperator = await this.prisma.cooperator.upsert({
      where: { userId: user.id },
      create: {
        user: { connect: { id: user.id } },
      },
      update: {},
    })

    const existingRoles = user.roles || []
    let userWithUpdatedRoles = user
    if (!existingRoles.includes(Role.COOPERATOR)) {
      userWithUpdatedRoles = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          roles: [...existingRoles, Role.COOPERATOR],
        },
      })
    }

    const scopeMode = invitation.scopeMode
    const permissions = MerchantAccessService.normalizePermissions(invitation.permissions)
    const storeScopeAll = scopeMode === OperatorScopeMode.FULL_MERCHANT ? true : invitation.storeScopeAll
    const scopedStoreIds =
      scopeMode === OperatorScopeMode.STORE_SCOPED && !storeScopeAll
        ? invitation.storeAccesses.map((item) => item.merchantStoreId)
        : []

    const membership = await this.prisma.cooperatorCompany.upsert({
      where: {
        CollabToCompany: {
          cooperatorId: cooperator.id,
          companyOwnerId: owner.id,
        },
      },
      create: {
        displayName: user.name || user.firstName || user.email,
        cooperatorId: cooperator.id,
        companyOwnerId: owner.id,
        scopeMode,
        permissions,
        storeScopeAll,
      },
      update: {
        scopeMode,
        permissions,
        storeScopeAll,
        deletedAt: null,
      },
    })

    await this.prisma.cooperatorCompanyStoreAccess.deleteMany({
      where: {
        cooperatorCompanyId: membership.id,
      },
    })

    if (!storeScopeAll) {
      if (scopedStoreIds.length > 0) {
        await this.prisma.cooperatorCompanyStoreAccess.createMany({
          data: scopedStoreIds.map((merchantStoreId) => ({
            cooperatorCompanyId: membership.id,
            merchantStoreId,
          })),
          skipDuplicates: true,
        })
      }
    }

    await this.prisma.cooperatorInvitation.update({
      where: { id: invitation.id },
      data: {
        acceptedAt: new Date(),
      },
    })

    const token = generateJWT(userWithUpdatedRoles)

    return {
      token,
      merchantId: owner.company.merchant.id,
      merchantName: owner.company.merchant.name,
      scopeMode,
      permissions,
      storeScopeAll,
      storeIds: scopedStoreIds,
      cooperatorId: cooperator.id,
    }
  }
}
