import { Role } from '../../User/objectType/Role'
import type { Context } from '../../shared/interface/Context'

export function bypassAssignedCouponVisibilityFilter(ctx: Context): boolean {
  const roles = ctx.req.user?.roles ?? []
  return roles.includes(Role.ADMIN)
}

export function isCouponAssignableVisibleToViewer(
  assignToUserId: string | null | undefined,
  viewerUserId: string | undefined
): boolean {
  if (assignToUserId == null || assignToUserId === '') {
    return true
  }
  if (!viewerUserId) {
    return false
  }
  return assignToUserId === viewerUserId
}
