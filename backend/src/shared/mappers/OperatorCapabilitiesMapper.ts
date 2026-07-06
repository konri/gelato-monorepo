import { OperatorPermission, OperatorScopeMode, Role } from '@prisma/client'
import { OperatorMerchantScope } from '../service/MerchantAccessService'
import {
  OperatorCapabilities,
  OperatorMerchantCapability,
  OperatorMerchantEditCapabilities,
} from '../../User/objectType/OperatorCapabilities'
import { MERCHANT_BASE_CONFIG_PERMISSIONS } from '../consts/operatorCapabilityPermissionGroups'

const ALL_TRUE_EDIT_CAPABILITIES: OperatorMerchantEditCapabilities = {
  canEditMerchantBaseConfig: true,
  canEditCouponStoreOverrides: true,
  canEditRewardStoreOverrides: true,
  canEditStreakStoreOverrides: true,
  canEditGlobalCoupons: true,
  canEditGlobalRewards: true,
  canEditMerchantProfile: true,
  canEditGlobalStampTemplates: true,
  canEditGlobalStreaks: true,
  canEditMerchantPointsProgram: true,
}

export class OperatorCapabilitiesMapper {
  static toGraphQL(roles: string[], scopes: OperatorMerchantScope[]): OperatorCapabilities {
    return {
      roles,
      isAdmin: false,
      isOwner: roles.includes(Role.OWNER),
      merchantScopes: this.toMerchantCapabilityArray(scopes),
    }
  }

  static toAdminGraphQL(roles: string[], scopes: OperatorMerchantScope[]): OperatorCapabilities {
    return {
      roles,
      isAdmin: true,
      isOwner: roles.includes(Role.OWNER),
      merchantScopes: this.toMerchantCapabilityArray(scopes).map((scope) =>
        this.withAllCapabilitiesUnlockedForAdmin(scope)
      ),
    }
  }

  private static withAllCapabilitiesUnlockedForAdmin(scope: OperatorMerchantCapability): OperatorMerchantCapability {
    return {
      ...scope,
      editCapabilities: ALL_TRUE_EDIT_CAPABILITIES,
    }
  }

  private static canEditMerchantWideBase(scope: OperatorMerchantScope, permission: OperatorPermission): boolean {
    return scope.scopeMode === OperatorScopeMode.FULL_MERCHANT && scope.permissions.includes(permission)
  }

  private static toEditCapabilities(scope: OperatorMerchantScope): OperatorMerchantEditCapabilities {
    return {
      canEditMerchantBaseConfig:
        scope.scopeMode === OperatorScopeMode.FULL_MERCHANT &&
        MERCHANT_BASE_CONFIG_PERMISSIONS.some((permission) => scope.permissions.includes(permission)),
      canEditCouponStoreOverrides: scope.permissions.includes(OperatorPermission.COUPON_OVERRIDE_WRITE),
      canEditRewardStoreOverrides: scope.permissions.includes(OperatorPermission.REWARD_OVERRIDE_WRITE),
      canEditStreakStoreOverrides: scope.permissions.includes(OperatorPermission.STREAK_OVERRIDE_WRITE),
      canEditGlobalCoupons: this.canEditMerchantWideBase(scope, OperatorPermission.COUPON_BASE_WRITE),
      canEditGlobalRewards: this.canEditMerchantWideBase(scope, OperatorPermission.REWARD_BASE_WRITE),
      canEditMerchantProfile: this.canEditMerchantWideBase(scope, OperatorPermission.MERCHANT_PROFILE_WRITE),
      canEditGlobalStampTemplates: this.canEditMerchantWideBase(scope, OperatorPermission.STAMP_TEMPLATE_BASE_WRITE),
      canEditGlobalStreaks: this.canEditMerchantWideBase(scope, OperatorPermission.STREAK_BASE_WRITE),
      canEditMerchantPointsProgram: this.canEditMerchantWideBase(scope, OperatorPermission.POINTS_PROGRAM_WRITE),
    }
  }

  private static toMerchantCapability(scope: OperatorMerchantScope): OperatorMerchantCapability {
    return {
      merchantId: scope.merchantId,
      scopeMode: scope.scopeMode,
      permissions: scope.permissions,
      storeScopeAll: scope.storeScopeAll,
      storeIds: scope.storeIds,
      editCapabilities: this.toEditCapabilities(scope),
    }
  }

  private static toMerchantCapabilityArray(scopes: OperatorMerchantScope[]): OperatorMerchantCapability[] {
    return scopes.map((scope) => this.toMerchantCapability(scope))
  }
}
