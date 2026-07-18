import { Resolver, Query, Mutation, Arg, Ctx, Authorized, ID, Int } from 'type-graphql';
import { Role, TransactionType } from '@prisma/client';
import { Context } from '../types/Context';
import {
  PointBalanceType,
  PointTransactionType,
  ReferralCodeType,
  ReferralType,
  ReferralStatsType,
  LoyaltyCustomerType,
} from '../types/PointsType';
import { PubSubService } from '../services/PubSubService';

/**
 * Points and Referral System Resolver
 *
 * Handles:
 * - Point balance management
 * - Point transactions (earn, spend, refund)
 * - Referral code generation
 * - Referral tracking and rewards
 * - Transaction history
 *
 * Loyalty Point Rules:
 * - 1% of order subtotal = points earned
 * - 100 points = 1 PLN discount
 * - Birthday: 500 bonus points (one-time)
 * - Referral: 500 points for referrer after referee's first purchase
 *
 * Role-based access:
 * - CLIENT: Manage own points and referrals
 * - SPOT_ADMIN/EMPLOYEE: Award bonus points (QR scan)
 * - SUPER_ADMIN: Full access to all point operations
 */
@Resolver()
export class PointsResolver {
  /**
   * Resolve a customer by their real user id (from the loyalty QR) or their
   * short loyalty code (typed by staff, e.g. "GL-ABCD2345"). Returns the user
   * id + name, or null if nothing matches.
   *
   * id is a text column (uuid string), so comparing it against a loyalty code
   * is a safe text comparison — no cast error.
   */
  private static async resolveCustomer(
    prisma: Context['prisma'],
    idOrCode: string,
  ): Promise<{ id: string; name: string | null } | null> {
    const raw = idOrCode.trim();
    if (!raw) return null;
    const normalizedCode = raw.toUpperCase().replace(/\s+/g, '');
    return prisma.user.findFirst({
      where: { OR: [{ id: raw }, { loyaltyCode: normalizedCode }] },
      select: { id: true, name: true },
    });
  }

  /**
   * Look up a customer (by loyalty QR id or typed account code) so spot staff
   * can confirm who they're awarding points to — shows name, current balance,
   * and how many prizes they can currently afford.
   */
  @Authorized([Role.SUPER_ADMIN, Role.SPOTS_ADMIN, Role.SPOT_ADMIN, Role.EMPLOYEE])
  @Query(() => LoyaltyCustomerType, { nullable: true })
  async loyaltyCustomer(
    @Arg('idOrCode', () => String) idOrCode: string,
    @Ctx() { prisma }: Context,
  ): Promise<LoyaltyCustomerType | null> {
    const match = await PointsResolver.resolveCustomer(prisma, idOrCode);
    if (!match) return null;

    const user = await prisma.user.findUnique({
      where: { id: match.id },
      select: {
        id: true,
        name: true,
        firstName: true,
        surname: true,
        loyaltyCode: true,
        profilePicture: true,
        pointBalance: { select: { availablePoints: true, totalPoints: true } },
      },
    });
    if (!user) return null;

    const availablePoints = user.pointBalance?.availablePoints ?? 0;
    // Active prizes (respecting quantity/validity window) the customer can afford.
    const now = new Date();
    const prizes = await prisma.prize.findMany({
      where: {
        isActive: true,
        pointsCost: { lte: availablePoints },
        AND: [
          { OR: [{ validFrom: null }, { validFrom: { lte: now } }] },
          { OR: [{ validUntil: null }, { validUntil: { gte: now } }] },
        ],
      },
      select: { quantity: true, claimed: true },
    });
    const availablePrizes = prizes.filter(
      (p) => p.quantity == null || p.claimed < p.quantity,
    ).length;

    return {
      id: user.id,
      name: user.name || [user.firstName, user.surname].filter(Boolean).join(' ') || undefined,
      loyaltyCode: user.loyaltyCode ?? undefined,
      profilePicture: user.profilePicture ?? undefined,
      availablePoints,
      totalPoints: user.pointBalance?.totalPoints ?? 0,
      availablePrizes,
    };
  }

  /**
   * Get user's point balance
   */
  @Authorized()
  @Query(() => PointBalanceType, { nullable: true })
  async myPointBalance(
    @Ctx() { req, prisma }: Context
  ): Promise<PointBalanceType | null> {
    const userId = req.user!.id;

    let balance = await prisma.pointBalance.findUnique({
      where: { userId },
    });

    // Create balance if doesn't exist
    if (!balance) {
      balance = await prisma.pointBalance.create({
        data: {
          userId,
          totalPoints: 0,
          availablePoints: 0,
          lockedPoints: 0,
        },
      });
    }

    return balance as PointBalanceType;
  }

  /**
   * Get point transaction history
   */
  @Authorized()
  @Query(() => [PointTransactionType])
  async myPointTransactions(
    @Arg('limit', () => Int, { defaultValue: 50 }) limit: number = 50,
    @Ctx() { req, prisma }: Context
  ): Promise<PointTransactionType[]> {
    const userId = req.user!.id;

    return prisma.pointTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    }) as Promise<PointTransactionType[]>;
  }

  /**
   * Award points to user (manual bonus - for spot staff via QR scan)
   */
  @Authorized([Role.SUPER_ADMIN, Role.SPOTS_ADMIN, Role.SPOT_ADMIN, Role.EMPLOYEE])
  @Mutation(() => Boolean)
  async awardPoints(
    // Accepts either the customer's real user id (from the QR) or their short
    // loyalty code (typed by staff), e.g. "GL-ABCD2345".
    @Arg('userId', () => ID) userIdOrCode: string,
    @Arg('points', () => Int) points: number,
    @Arg('description') description: string,
    @Arg('spotId', () => ID, { nullable: true }) spotId: string | undefined,
    @Ctx() { req, prisma }: Context
  ): Promise<boolean> {
    const user = req.user!;

    if (points <= 0) {
      throw new Error('Points must be positive');
    }

    // Resolve the target customer by real id (from the QR) or loyalty code
    // (typed by staff).
    const target = await PointsResolver.resolveCustomer(prisma, userIdOrCode);
    if (!target) {
      throw new Error('Customer not found for that account number');
    }
    const userId = target.id;

    // Check permission for SPOT_ADMIN/EMPLOYEE
    if (
      spotId &&
      !user.roles.includes(Role.SUPER_ADMIN) &&
      !user.roles.includes(Role.SPOTS_ADMIN)
    ) {
      const spotAdmin = await prisma.spotAdminProfile.findFirst({
        where: { userId: user.id, spotId },
      });

      const employee = await prisma.employeeProfile.findFirst({
        where: { userId: user.id, spotId },
      });

      if (!spotAdmin && !employee) {
        throw new Error('You can only award points for your spots');
      }
    }

    // Get or create point balance
    let balance = await prisma.pointBalance.findUnique({
      where: { userId },
    });

    if (!balance) {
      balance = await prisma.pointBalance.create({
        data: {
          userId,
          totalPoints: 0,
          availablePoints: 0,
          lockedPoints: 0,
        },
      });
    }

    // Update balance
    const newBalance = await prisma.pointBalance.update({
      where: { userId },
      data: {
        totalPoints: { increment: points },
        availablePoints: { increment: points },
      },
    });

    // Create transaction record
    await prisma.pointTransaction.create({
      data: {
        userId,
        type: TransactionType.BONUS,
        amount: points,
        description,
        referenceId: spotId,
        referenceType: spotId ? 'spot' : undefined,
        balanceBefore: balance.availablePoints,
        balanceAfter: newBalance.availablePoints,
      },
    });

    // Publish points update
    await PubSubService.publishPointsUpdated(
      userId,
      newBalance.totalPoints,
      newBalance.availablePoints,
      points
    );

    console.log(`✅ Awarded ${points} points to user ${userId}: ${description}`);

    return true;
  }

  /**
   * Get or create user's referral code
   */
  @Authorized([Role.CLIENT])
  @Query(() => ReferralCodeType)
  async myReferralCode(
    @Ctx() { req, prisma }: Context
  ): Promise<ReferralCodeType> {
    const userId = req.user!.id;

    // Check if code exists
    let referralCode = await prisma.referralCode.findUnique({
      where: { userId },
    });

    // Generate code if doesn't exist
    if (!referralCode) {
      const code = await this.generateUniqueReferralCode(prisma);
      referralCode = await prisma.referralCode.create({
        data: {
          userId,
          code,
        },
      });

      console.log(`✅ Generated referral code for user ${userId}: ${code}`);
    }

    return referralCode as ReferralCodeType;
  }

  /**
   * Apply referral code during registration
   */
  @Authorized([Role.CLIENT])
  @Mutation(() => Boolean)
  async applyReferralCode(
    @Arg('code') code: string,
    @Ctx() { req, prisma }: Context
  ): Promise<boolean> {
    const userId = req.user!.id;

    // Check if user already used a referral code
    const existing = await prisma.referral.findUnique({
      where: { referredUserId: userId },
    });

    if (existing) {
      throw new Error('You have already used a referral code');
    }

    // Find referral code
    const referralCode = await prisma.referralCode.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!referralCode) {
      throw new Error('Invalid referral code');
    }

    // Cannot refer yourself
    if (referralCode.userId === userId) {
      throw new Error('Cannot use your own referral code');
    }

    // Create referral relationship
    await prisma.referral.create({
      data: {
        referrerId: referralCode.userId,
        referredUserId: userId,
        code,
        pointsAwarded: false, // Will be awarded after first purchase
      },
    });

    console.log(`✅ User ${userId} applied referral code ${code} from ${referralCode.userId}`);

    return true;
  }

  /**
   * Get referral stats
   */
  @Authorized([Role.CLIENT])
  @Query(() => ReferralStatsType)
  async myReferralStats(
    @Ctx() { req, prisma }: Context
  ): Promise<ReferralStatsType> {
    const userId = req.user!.id;

    // Get all referrals where user is the referrer
    const referrals = await prisma.referral.findMany({
      where: { referrerId: userId },
    });

    const totalReferrals = referrals.length;
    const completedReferrals = referrals.filter((r) => r.pointsAwarded).length;
    const pendingReferrals = totalReferrals - completedReferrals;

    // Each completed referral = 500 points
    const totalPointsEarned = completedReferrals * 500;

    return {
      totalReferrals,
      completedReferrals,
      pendingReferrals,
      totalPointsEarned,
    };
  }

  /**
   * Get list of user's referrals
   */
  @Authorized([Role.CLIENT])
  @Query(() => [ReferralType])
  async myReferrals(
    @Ctx() { req, prisma }: Context
  ): Promise<ReferralType[]> {
    const userId = req.user!.id;

    return prisma.referral.findMany({
      where: { referrerId: userId },
      orderBy: { createdAt: 'desc' },
    }) as Promise<ReferralType[]>;
  }

  /**
   * Award birthday bonus points (500 points, one-time)
   */
  @Authorized([Role.CLIENT])
  @Mutation(() => Boolean)
  async claimBirthdayBonus(
    @Ctx() { req, prisma }: Context
  ): Promise<boolean> {
    const userId = req.user!.id;

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { birthDate: true, birthdayCompleted: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    if (!user.birthDate) {
      throw new Error('Birthdate not set');
    }

    if (user.birthdayCompleted) {
      throw new Error('Birthday bonus already claimed');
    }

    // Award 500 points
    await this.addPointsToUser(
      userId,
      500,
      TransactionType.BIRTHDAY,
      'Birthday bonus',
      undefined,
      undefined,
      prisma
    );

    // Mark birthday as completed
    await prisma.user.update({
      where: { id: userId },
      data: { birthdayCompleted: true },
    });

    console.log(`✅ User ${userId} claimed birthday bonus: 500 points`);

    return true;
  }

  /**
   * Award referral points when referee makes first purchase
   * (Called internally by order completion)
   */
  async awardReferralPoints(
    referredUserId: string,
    orderId: string,
    prisma: any
  ): Promise<boolean> {
    // Check if this is the user's first order
    const orderCount = await prisma.order.count({
      where: {
        userId: referredUserId,
        status: 'DELIVERED',
      },
    });

    if (orderCount !== 1) {
      return false; // Not first order
    }

    // Get referral record
    const referral = await prisma.referral.findUnique({
      where: { referredUserId },
    });

    if (!referral || referral.pointsAwarded) {
      return false; // No referral or already awarded
    }

    // Award 500 points to referrer
    await this.addPointsToUser(
      referral.referrerId,
      500,
      TransactionType.REFERRAL,
      'Referral bonus - friend completed first order',
      orderId,
      'order',
      prisma
    );

    // Mark as awarded
    await prisma.referral.update({
      where: { referredUserId },
      data: { pointsAwarded: true },
    });

    console.log(`✅ Awarded referral bonus: 500 points to ${referral.referrerId} for ${referredUserId}'s first order`);

    return true;
  }

  /**
   * Helper: Add points to user
   */
  private async addPointsToUser(
    userId: string,
    points: number,
    type: TransactionType,
    description: string,
    referenceId: string | undefined,
    referenceType: string | undefined,
    prisma: any
  ): Promise<void> {
    // Get or create balance
    let balance = await prisma.pointBalance.findUnique({
      where: { userId },
    });

    if (!balance) {
      balance = await prisma.pointBalance.create({
        data: {
          userId,
          totalPoints: 0,
          availablePoints: 0,
          lockedPoints: 0,
        },
      });
    }

    // Update balance
    const newBalance = await prisma.pointBalance.update({
      where: { userId },
      data: {
        totalPoints: { increment: points },
        availablePoints: { increment: points },
      },
    });

    // Create transaction
    await prisma.pointTransaction.create({
      data: {
        userId,
        type,
        amount: points,
        description,
        referenceId,
        referenceType,
        balanceBefore: balance.availablePoints,
        balanceAfter: newBalance.availablePoints,
      },
    });

    // Publish update
    await PubSubService.publishPointsUpdated(
      userId,
      newBalance.totalPoints,
      newBalance.availablePoints,
      points
    );
  }

  /**
   * Helper: Generate unique referral code
   */
  private async generateUniqueReferralCode(prisma: any): Promise<string> {
    const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude ambiguous chars
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      let code = '';
      for (let i = 0; i < 8; i++) {
        code += characters.charAt(Math.floor(Math.random() * characters.length));
      }

      // Check if code exists
      const existing = await prisma.referralCode.findUnique({
        where: { code },
      });

      if (!existing) {
        return code;
      }

      attempts++;
    }

    throw new Error('Failed to generate unique referral code');
  }
}
