import { OperatorPermission, OperatorScopeMode, PrismaClient, Role } from '@prisma/client'
import { MERCHANT_BASE_CONFIG_PERMISSIONS } from '../consts/operatorCapabilityPermissionGroups'

export type OperatorMerchantScope = {
  merchantId: string
  scopeMode: OperatorScopeMode
  permissions: OperatorPermission[]
  storeScopeAll: boolean
  storeIds: string[]
}

export class MerchantAccessService {
  static readonly OWNER_PERMISSIONS: OperatorPermission[] = Object.values(OperatorPermission)

  static normalizePermissions(permissions: OperatorPermission[]): OperatorPermission[] {
    return [...new Set(permissions)]
  }

  constructor(private prisma: PrismaClient) {}

  async getCooperatorMembershipForMerchant(userId: string, merchantId: string) {
    return this.prisma.cooperatorCompany.findFirst({
      where: {
        cooperator: { userId },
        deletedAt: null,
        companyOwner: {
          company: {
            merchant: {
              id: merchantId,
            },
          },
        },
      },
      include: {
        storeAccesses: true,
      },
    })
  }

  private async resolveOwnerScope(userId: string): Promise<OperatorMerchantScope | null> {
    const company = await this.prisma.company.findUnique({
      where: { userId },
      include: { merchant: true },
    })

    if (!company?.merchant?.id) {
      return null
    }

    return {
      merchantId: company.merchant.id,
      scopeMode: OperatorScopeMode.FULL_MERCHANT,
      permissions: MerchantAccessService.OWNER_PERMISSIONS,
      storeScopeAll: true,
      storeIds: [],
    }
  }

  private async resolveCooperatorScopes(userId: string): Promise<OperatorMerchantScope[]> {
    const memberships = await this.prisma.cooperatorCompany.findMany({
      where: {
        cooperator: { userId },
        deletedAt: null,
      },
      include: {
        storeAccesses: true,
        companyOwner: {
          include: {
            company: {
              include: {
                merchant: true,
              },
            },
          },
        },
      },
    })

    return memberships
      .map((membership) => {
        const merchantId = membership.companyOwner?.company?.merchant?.id
        if (!merchantId) {
          return null
        }

        return {
          merchantId,
          scopeMode: membership.scopeMode,
          permissions: MerchantAccessService.normalizePermissions(membership.permissions),
          storeScopeAll: membership.storeScopeAll,
          storeIds: (membership.storeAccesses ?? []).map((item) => item.merchantStoreId),
        }
      })
      .filter((item): item is OperatorMerchantScope => item !== null)
  }

  private mergeScopes(scopes: OperatorMerchantScope[]): OperatorMerchantScope[] {
    const merged = new Map<string, OperatorMerchantScope>()

    for (const scope of scopes) {
      const existing = merged.get(scope.merchantId)
      if (!existing) {
        merged.set(scope.merchantId, scope)
        continue
      }

      const mergedPermissions = MerchantAccessService.normalizePermissions([
        ...existing.permissions,
        ...scope.permissions,
      ])
      const mergedScopeMode =
        existing.scopeMode === OperatorScopeMode.FULL_MERCHANT || scope.scopeMode === OperatorScopeMode.FULL_MERCHANT
          ? OperatorScopeMode.FULL_MERCHANT
          : OperatorScopeMode.STORE_SCOPED
      const mergedStoreScopeAll =
        existing.storeScopeAll || scope.storeScopeAll || mergedScopeMode === OperatorScopeMode.FULL_MERCHANT
      const mergedStoreIds = [...new Set([...existing.storeIds, ...scope.storeIds])]

      merged.set(scope.merchantId, {
        merchantId: scope.merchantId,
        scopeMode: mergedScopeMode,
        permissions: mergedPermissions,
        storeScopeAll: mergedStoreScopeAll,
        storeIds: mergedStoreScopeAll ? [] : mergedStoreIds,
      })
    }

    return [...merged.values()]
  }

  async resolveOperatorMerchantScopes(userId: string, roles: string[]): Promise<OperatorMerchantScope[]> {
    if (roles.includes(Role.ADMIN)) {
      return []
    }

    const scopes: OperatorMerchantScope[] = []

    if (roles.includes(Role.OWNER)) {
      const ownerScope = await this.resolveOwnerScope(userId)
      if (ownerScope) {
        scopes.push(ownerScope)
      }
    }

    if (roles.includes(Role.COOPERATOR)) {
      scopes.push(...(await this.resolveCooperatorScopes(userId)))
    }

    return this.mergeScopes(scopes)
  }

  async ensureMerchantAccess(userId: string, roles: string[], merchantId: string): Promise<boolean> {
    if (roles.includes(Role.ADMIN)) {
      return true
    }

    const scopes = await this.resolveOperatorMerchantScopes(userId, roles)
    return scopes.some((scope) => scope.merchantId === merchantId)
  }

  async ensureStoreAccess(userId: string, roles: string[], merchantId: string, storeId: string): Promise<boolean> {
    if (roles.includes(Role.ADMIN)) {
      return true
    }

    if (!roles.includes(Role.OWNER) && !roles.includes(Role.COOPERATOR)) {
      return false
    }

    const scopes = await this.resolveOperatorMerchantScopes(userId, roles)
    const scope = scopes.find((item) => item.merchantId === merchantId)
    if (!scope) {
      return false
    }

    if (scope.scopeMode === OperatorScopeMode.FULL_MERCHANT || scope.storeScopeAll) {
      return true
    }

    return scope.storeIds.includes(storeId)
  }

  async resolvePrimaryMerchantId(userId: string, roles: string[]): Promise<string | null> {
    if (roles.includes(Role.ADMIN)) {
      return null
    }

    const scopes = await this.resolveOperatorMerchantScopes(userId, roles)
    return scopes[0]?.merchantId ?? null
  }

  async resolveMerchantIdsByPermission(
    userId: string,
    roles: string[],
    permission: OperatorPermission
  ): Promise<string[]> {
    if (roles.includes(Role.ADMIN)) {
      return []
    }
    const scopes = await this.resolveOperatorMerchantScopes(userId, roles)
    return [
      ...new Set(scopes.filter((scope) => scope.permissions.includes(permission)).map((scope) => scope.merchantId)),
    ]
  }

  async resolvePrimaryMerchantIdByPermission(
    userId: string,
    roles: string[],
    permission: OperatorPermission
  ): Promise<string | null> {
    if (roles.includes(Role.ADMIN)) {
      return null
    }
    const scopes = await this.resolveOperatorMerchantScopes(userId, roles)
    const filteredScopes = scopes.filter((scope) => scope.permissions.includes(permission))
    return filteredScopes[0]?.merchantId ?? null
  }

  async resolveOperatorMerchantScopesByPermission(
    userId: string,
    roles: string[],
    permission: OperatorPermission
  ): Promise<OperatorMerchantScope[]> {
    if (roles.includes(Role.ADMIN)) {
      return []
    }
    const scopes = await this.resolveOperatorMerchantScopes(userId, roles)
    return scopes.filter((scope) => scope.permissions.includes(permission))
  }

  async hasPermission(
    userId: string,
    roles: string[],
    merchantId: string,
    permission: OperatorPermission
  ): Promise<boolean> {
    if (roles.includes(Role.ADMIN)) {
      return true
    }
    const scopes = await this.resolveOperatorMerchantScopes(userId, roles)
    const scope = scopes.find((item) => item.merchantId === merchantId)
    if (!scope) {
      return false
    }
    return scope.permissions.includes(permission)
  }

  /**
   * Merchant-wide defaults (profile, coupons/rewards/stamps/streaks base, points program rules) may only
   * be changed with FULL_MERCHANT scope. STORE_SCOPED operators use per-store override mutations instead.
   */
  async canEditMerchantWideBaseConfig(
    userId: string,
    roles: string[],
    merchantId: string,
    permission: OperatorPermission
  ): Promise<boolean> {
    if (!MERCHANT_BASE_CONFIG_PERMISSIONS.includes(permission)) {
      throw new Error(`canEditMerchantWideBaseConfig: ${permission} is not listed in MERCHANT_BASE_CONFIG_PERMISSIONS`)
    }
    if (roles.includes(Role.ADMIN)) {
      return true
    }
    const scopes = await this.resolveOperatorMerchantScopes(userId, roles)
    const scope = scopes.find((item) => item.merchantId === merchantId)
    if (!scope) {
      return false
    }
    if (scope.scopeMode !== OperatorScopeMode.FULL_MERCHANT) {
      return false
    }
    return scope.permissions.includes(permission)
  }
}
