import { createMethodDecorator } from 'type-graphql';
import { Role } from '@prisma/client';
import { Context } from '../types/Context';

/**
 * Permission check function type
 */
export type PermissionChecker = (context: Context) => Promise<boolean> | boolean;

/**
 * Custom permission decorator
 *
 * Use this for complex permission logic beyond simple role checks
 *
 * @example
 * ```typescript
 * @CheckPermissions(async ({ req, prisma }) => {
 *   // Custom logic - e.g., check if user owns a resource
 *   return true;
 * })
 * ```
 */
export function CheckPermissions(checker: PermissionChecker) {
  return createMethodDecorator<Context>(async ({ context }, next) => {
    const hasPermission = await checker(context);

    if (!hasPermission) {
      throw new Error('Access denied - insufficient permissions');
    }

    return next();
  });
}

/**
 * Check if user has any of the specified roles
 */
export function hasAnyRole(user: { roles: Role[] }, allowedRoles: Role[]): boolean {
  return user.roles.some(role => allowedRoles.includes(role));
}

/**
 * Check if user has all of the specified roles
 */
export function hasAllRoles(user: { roles: Role[] }, requiredRoles: Role[]): boolean {
  return requiredRoles.every(role => user.roles.includes(role));
}

/**
 * Check if user is a super admin
 */
export function isSuperAdmin(user: { roles: Role[] }): boolean {
  return user.roles.includes(Role.SUPER_ADMIN);
}

/**
 * Check if user is any type of admin
 */
export function isAnyAdmin(user: { roles: Role[] }): boolean {
  return (
    user.roles.includes(Role.SUPER_ADMIN) ||
    user.roles.includes(Role.SPOTS_ADMIN) ||
    user.roles.includes(Role.SPOT_ADMIN)
  );
}

/**
 * Check if user can manage a specific spot
 */
export async function canManageSpot(
  userId: string,
  spotId: string,
  prisma: any
): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, roles: true },
  });

  if (!user) return false;

  // Super admin and spots admin can manage any spot.
  if (isSuperAdmin(user) || user.roles.includes(Role.SPOTS_ADMIN)) {
    return true;
  }

  // A spot admin can manage a spot they're bound to via SpotAdminProfile
  // (the real relation — `managedSpots`/`employmentSpots` don't exist).
  const admin = await prisma.spotAdminProfile.findFirst({
    where: { userId, spotId },
  });
  return !!admin;
}

/**
 * Check if user can view orders from a specific spot
 */
export async function canViewSpotOrders(
  userId: string,
  spotId: string,
  prisma: any
): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      managedSpots: true,
      employmentSpots: true,
    },
  });

  if (!user) return false;

  // Admins can view any spot's orders
  if (isAnyAdmin(user)) {
    return true;
  }

  // Employees can view orders from their employment spot
  if (user.roles.includes(Role.EMPLOYEE)) {
    return user.employmentSpots.some((spot: any) => spot.id === spotId);
  }

  return false;
}
