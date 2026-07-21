import { Resolver, Query, Mutation, Arg, Ctx, Authorized, ID, FieldResolver, Root } from 'type-graphql';
import { Role, TransactionType } from '@prisma/client';
import { Context } from '../types/Context';
import { UserType } from '../types/UserType';
import { CityType } from '../types/CityType';
import { UserChangeInput } from '../types/UserChangeInput';
import { PubSubService } from '../services/PubSubService';

// Birthday quest reward — kept in sync with the client Tasks card (+700).
const BIRTHDAY_BONUS_POINTS = 700;

/**
 * User Management Resolver
 *
 * Handles user CRUD operations with role-based access control:
 * - SUPER_ADMIN: Full access to all users
 * - SPOTS_ADMIN: Can view and manage spot admins and employees
 * - SPOT_ADMIN: Can view employees in their spot
 */
@Resolver(() => UserType)
export class UserResolver {
  /**
   * Resolve the user's preferred city
   */
  @FieldResolver(() => CityType, { nullable: true })
  async preferredCity(
    @Root() user: UserType,
    @Ctx() { prisma }: Context
  ): Promise<CityType | null> {
    if (!user.preferredCityId) return null;
    return prisma.city.findUnique({
      where: { id: user.preferredCityId },
    }) as Promise<CityType | null>;
  }

  /**
   * Get all users (SUPER_ADMIN only)
   */
  @Authorized([Role.SUPER_ADMIN])
  @Query(() => [UserType])
  async users(@Ctx() { prisma }: Context): Promise<UserType[]> {
    return prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
    }) as Promise<UserType[]>;
  }

  /**
   * Get user by ID (authenticated users can view)
   */
  @Authorized()
  @Query(() => UserType, { nullable: true })
  async user(
    @Arg('id', () => ID) id: string,
    @Ctx() { req, prisma }: Context
  ): Promise<UserType | null> {
    const currentUser = req.user!;

    // SUPER_ADMIN can view anyone
    if (currentUser.roles.includes(Role.SUPER_ADMIN)) {
      return prisma.user.findUnique({ where: { id } }) as Promise<UserType | null>;
    }

    // Users can view their own profile
    if (currentUser.id === id) {
      return currentUser as UserType;
    }

    // SPOTS_ADMIN and SPOT_ADMIN can view users in their organization
    // (This would require spot membership checking - simplified for now)
    if (
      currentUser.roles.includes(Role.SPOTS_ADMIN) ||
      currentUser.roles.includes(Role.SPOT_ADMIN)
    ) {
      return prisma.user.findUnique({ where: { id } }) as Promise<UserType | null>;
    }

    throw new Error('Access denied');
  }

  /**
   * Update the authenticated user's own profile.
   * Only provided fields are changed. Birthday becomes immutable once set
   * (birthdayCompleted), so further birthDate changes are rejected.
   */
  @Authorized()
  @Mutation(() => UserType)
  async updateProfile(
    @Arg('data', () => UserChangeInput) data: UserChangeInput,
    @Ctx() { req, prisma }: Context
  ): Promise<UserType> {
    const userId = req.user!.id;

    const current = await prisma.user.findUnique({
      where: { id: userId },
      select: { birthDate: true, birthdayCompleted: true, phone: true },
    });

    if (!current) {
      throw new Error('User not found');
    }

    const updateData: Record<string, unknown> = {};

    if (data.firstName !== undefined) updateData.firstName = data.firstName;
    if (data.surname !== undefined) updateData.surname = data.surname;
    if (data.name !== undefined) updateData.name = data.name;
    if (data.picture !== undefined) updateData.profilePicture = data.picture;

    if (data.preferredCityId !== undefined) {
      const city = await prisma.city.findUnique({ where: { id: data.preferredCityId } });
      if (!city) {
        throw new Error('City not found');
      }
      updateData.preferredCityId = data.preferredCityId;
    }

    if (data.phone !== undefined && data.phone !== current.phone) {
      // Phone is unique — surface a clean error instead of a Prisma crash.
      const existing = await prisma.user.findFirst({
        where: { phone: data.phone, NOT: { id: userId } },
        select: { id: true },
      });
      if (existing) {
        throw new Error('Phone number already in use');
      }
      updateData.phone = data.phone;
    }

    // Set the birthday on first submit and complete the birthday quest in the
    // same step (award the bonus + flag birthdayCompleted). A resubmit with the
    // SAME date is a no-op (not an error) so the task screen never shows a
    // spurious "Birthday is already set" — only a genuine CHANGE is rejected.
    let awardBirthdayBonus = false;
    if (data.birthDate !== undefined) {
      const parsed = new Date(data.birthDate);
      if (isNaN(parsed.getTime())) {
        throw new Error('Invalid birth date');
      }
      if (current.birthDate) {
        // Already set — allow an identical resubmit, reject a real change.
        const sameDay =
          current.birthDate.toISOString().slice(0, 10) === parsed.toISOString().slice(0, 10);
        if (!sameDay) {
          throw new Error('Birthday is already set and cannot be changed');
        }
      } else {
        updateData.birthDate = parsed;
        if (!current.birthdayCompleted) {
          updateData.birthdayCompleted = true;
          awardBirthdayBonus = true;
        }
      }
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    // Award the one-time birthday bonus now that the date is saved. Guarded by
    // birthdayCompleted above so it can never double-award.
    if (awardBirthdayBonus) {
      await this.awardBirthdayBonus(userId, prisma).catch((e) =>
        console.error('Failed to award birthday bonus:', e),
      );
    }

    console.log(`✅ Profile updated: ${updated.email}`);

    return updated as UserType;
  }

  /**
   * Credit the one-time birthday bonus (points + ledger transaction) and push a
   * live balance update. Mirrors PointsResolver.claimBirthdayBonus so setting
   * the birthday in the profile completes the quest without a second call.
   */
  private async awardBirthdayBonus(userId: string, prisma: Context['prisma']): Promise<void> {
    const balance =
      (await prisma.pointBalance.findUnique({ where: { userId } })) ??
      (await prisma.pointBalance.create({
        data: { userId, totalPoints: 0, availablePoints: 0, lockedPoints: 0 },
      }));

    const newBalance = await prisma.pointBalance.update({
      where: { userId },
      data: {
        totalPoints: { increment: BIRTHDAY_BONUS_POINTS },
        availablePoints: { increment: BIRTHDAY_BONUS_POINTS },
      },
    });

    await prisma.pointTransaction.create({
      data: {
        userId,
        type: TransactionType.BIRTHDAY,
        amount: BIRTHDAY_BONUS_POINTS,
        description: 'Birthday bonus',
        balanceBefore: balance.availablePoints,
        balanceAfter: newBalance.availablePoints,
      },
    });

    await PubSubService.publishPointsUpdated(
      userId,
      newBalance.totalPoints,
      newBalance.availablePoints,
      BIRTHDAY_BONUS_POINTS,
    );

    console.log(`✅ Birthday bonus awarded to ${userId}: +${BIRTHDAY_BONUS_POINTS}`);
  }

  /**
   * Delete the authenticated user's own account permanently.
   */
  @Authorized()
  @Mutation(() => Boolean)
  async deleteAccount(@Ctx() { req, prisma }: Context): Promise<boolean> {
    const userId = req.user!.id;

    await prisma.user.delete({ where: { id: userId } });

    console.log(`✅ Account self-deleted: ${userId}`);

    return true;
  }

  /**
   * Update user roles (SUPER_ADMIN and SPOTS_ADMIN only)
   */
  @Authorized([Role.SUPER_ADMIN, Role.SPOTS_ADMIN])
  @Mutation(() => UserType)
  async updateUserRoles(
    @Arg('userId', () => ID) userId: string,
    @Arg('roles', () => [Role]) roles: Role[],
    @Ctx() { req, prisma }: Context
  ): Promise<UserType> {
    const currentUser = req.user!;

    // SPOTS_ADMIN cannot assign SUPER_ADMIN or SPOTS_ADMIN roles
    if (currentUser.roles.includes(Role.SPOTS_ADMIN)) {
      if (roles.includes(Role.SUPER_ADMIN) || roles.includes(Role.SPOTS_ADMIN)) {
        throw new Error('Insufficient permissions to assign admin roles');
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { roles },
    });

    console.log(`✅ User roles updated: ${updatedUser.email} -> ${roles.join(', ')}`);

    return updatedUser as UserType;
  }

  /**
   * Delete user (SUPER_ADMIN only)
   */
  @Authorized([Role.SUPER_ADMIN])
  @Mutation(() => Boolean)
  async deleteUser(
    @Arg('userId', () => ID) userId: string,
    @Ctx() { req, prisma }: Context
  ): Promise<boolean> {
    const currentUser = req.user!;

    // Prevent self-deletion
    if (currentUser.id === userId) {
      throw new Error('Cannot delete your own account');
    }

    await prisma.user.delete({
      where: { id: userId },
    });

    console.log(`✅ User deleted: ${userId}`);

    return true;
  }

  /**
   * Get users by role (SUPER_ADMIN and SPOTS_ADMIN only)
   */
  @Authorized([Role.SUPER_ADMIN, Role.SPOTS_ADMIN])
  @Query(() => [UserType])
  async usersByRole(
    @Arg('role', () => Role) role: Role,
    @Ctx() { prisma }: Context
  ): Promise<UserType[]> {
    return prisma.user.findMany({
      where: {
        roles: {
          has: role,
        },
      },
      orderBy: { createdAt: 'desc' },
    }) as Promise<UserType[]>;
  }

  /**
   * Search users by email or phone (SUPER_ADMIN and SPOTS_ADMIN only)
   */
  @Authorized([Role.SUPER_ADMIN, Role.SPOTS_ADMIN])
  @Query(() => [UserType])
  async searchUsers(
    @Arg('query') query: string,
    @Ctx() { prisma }: Context
  ): Promise<UserType[]> {
    return prisma.user.findMany({
      where: {
        OR: [
          { email: { contains: query, mode: 'insensitive' } },
          { phone: { contains: query } },
          { name: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: 20,
      orderBy: { createdAt: 'desc' },
    }) as Promise<UserType[]>;
  }
}
