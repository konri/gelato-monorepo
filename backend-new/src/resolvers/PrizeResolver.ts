import { Resolver, Query, Mutation, Arg, Ctx, Authorized, ID, Int } from 'type-graphql';
import { Role, TransactionType } from '@prisma/client';
import { Context } from '../types/Context';
import { PrizeType, UserPrizeType } from '../types/PrizeType';
import { v4 as uuidv4 } from 'uuid';
import { PubSubService } from '../services/PubSubService';

/**
 * Prize System Resolver
 *
 * Handles:
 * - Prize catalog browsing
 * - Prize redemption with points
 * - User prize management
 * - QR code generation for redemption
 * - Prize validation by spot staff
 *
 * Prize Redemption Flow:
 * 1. User browses available prizes
 * 2. User redeems prize with points
 * 3. System generates QR code
 * 4. User shows QR at spot
 * 5. Spot staff scans and validates QR
 *
 * Role-based access:
 * - CLIENT: Browse and redeem prizes
 * - SPOT_ADMIN/EMPLOYEE: Validate prize QR codes
 * - SUPER_ADMIN/SPOTS_ADMIN: Manage prize catalog
 */
@Resolver()
export class PrizeResolver {
  /**
   * Get all active prizes
   */
  @Query(() => [PrizeType])
  async prizes(
    @Arg('includeInactive', { nullable: true, defaultValue: false }) includeInactive: boolean = false,
    @Ctx() { prisma }: Context
  ): Promise<PrizeType[]> {
    const now = new Date();

    const where: any = {};

    if (!includeInactive) {
      where.isActive = true;
      where.OR = [
        { validFrom: null, validUntil: null },
        { validFrom: { lte: now }, validUntil: null },
        { validFrom: null, validUntil: { gte: now } },
        { validFrom: { lte: now }, validUntil: { gte: now } },
      ];
    }

    return prisma.prize.findMany({
      where,
      orderBy: { pointsCost: 'asc' },
    }) as Promise<PrizeType[]>;
  }

  /**
   * Get single prize by ID
   */
  @Query(() => PrizeType, { nullable: true })
  async prize(
    @Arg('id', () => ID) id: string,
    @Ctx() { prisma }: Context
  ): Promise<PrizeType | null> {
    return prisma.prize.findUnique({
      where: { id },
    }) as Promise<PrizeType | null>;
  }

  /**
   * Get user's redeemed prizes
   */
  @Authorized()
  @Query(() => [UserPrizeType])
  async myPrizes(
    @Arg('includeRedeemed', { nullable: true, defaultValue: true }) includeRedeemed: boolean = true,
    @Ctx() { req, prisma }: Context
  ): Promise<UserPrizeType[]> {
    const userId = req.user!.id;

    const where: any = { userId };
    if (!includeRedeemed) {
      where.isRedeemed = false;
    }

    const userPrizes = await prisma.userPrize.findMany({
      where,
      include: {
        prize: true,
      },
      orderBy: { claimedAt: 'desc' },
    });

    return userPrizes as UserPrizeType[];
  }

  /**
   * Get single user prize by ID
   */
  @Authorized()
  @Query(() => UserPrizeType, { nullable: true })
  async myPrize(
    @Arg('id', () => ID) id: string,
    @Ctx() { req, prisma }: Context
  ): Promise<UserPrizeType | null> {
    const userId = req.user!.id;

    const userPrize = await prisma.userPrize.findFirst({
      where: { id, userId },
      include: {
        prize: true,
      },
    });

    return userPrize as UserPrizeType | null;
  }

  /**
   * Redeem prize with points
   */
  @Authorized([Role.CLIENT])
  @Mutation(() => UserPrizeType)
  async redeemPrize(
    @Arg('prizeId', () => ID) prizeId: string,
    @Ctx() { req, prisma }: Context
  ): Promise<UserPrizeType> {
    const userId = req.user!.id;

    // Get prize
    const prize = await prisma.prize.findUnique({
      where: { id: prizeId },
    });

    if (!prize) {
      throw new Error('Prize not found');
    }

    if (!prize.isActive) {
      throw new Error('Prize is not available');
    }

    // Check validity period
    const now = new Date();
    if (prize.validFrom && prize.validFrom > now) {
      throw new Error('Prize is not yet available');
    }
    if (prize.validUntil && prize.validUntil < now) {
      throw new Error('Prize has expired');
    }

    // Check quantity
    if (prize.quantity !== null && prize.claimed >= prize.quantity) {
      throw new Error('Prize is out of stock');
    }

    // Get user's point balance
    const balance = await prisma.pointBalance.findUnique({
      where: { userId },
    });

    if (!balance || balance.availablePoints < prize.pointsCost) {
      throw new Error('Insufficient points');
    }

    // Deduct points
    const newBalance = await prisma.pointBalance.update({
      where: { userId },
      data: {
        availablePoints: { decrement: prize.pointsCost },
      },
    });

    // Create point transaction
    await prisma.pointTransaction.create({
      data: {
        userId,
        type: TransactionType.SPENT,
        amount: -prize.pointsCost,
        description: `Redeemed prize: ${prize.title}`,
        referenceId: prizeId,
        referenceType: 'prize',
        balanceBefore: balance.availablePoints,
        balanceAfter: newBalance.availablePoints,
      },
    });

    // Generate unique QR code
    const qrCode = this.generateQRCode();

    // Calculate validity (7 days from now)
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + 7);

    // Create user prize
    const userPrize = await prisma.userPrize.create({
      data: {
        userId,
        prizeId,
        qrCode,
        validUntil,
      },
      include: {
        prize: true,
      },
    });

    // Increment prize claimed count
    await prisma.prize.update({
      where: { id: prizeId },
      data: { claimed: { increment: 1 } },
    });

    // Publish points update
    await PubSubService.publishPointsUpdated(
      userId,
      newBalance.totalPoints,
      newBalance.availablePoints,
      -prize.pointsCost
    );

    console.log(`✅ User ${userId} redeemed prize ${prizeId}: ${prize.title} for ${prize.pointsCost} points`);

    return userPrize as UserPrizeType;
  }

  /**
   * Validate and redeem prize QR code (for spot staff)
   */
  @Authorized([Role.SUPER_ADMIN, Role.SPOTS_ADMIN, Role.SPOT_ADMIN, Role.EMPLOYEE])
  @Mutation(() => UserPrizeType)
  async validatePrizeQR(
    @Arg('qrCode') qrCode: string,
    @Arg('spotId', () => ID, { nullable: true }) spotId: string | undefined,
    @Ctx() { req, prisma }: Context
  ): Promise<UserPrizeType> {
    const user = req.user!;

    // Check spot permission for SPOT_ADMIN/EMPLOYEE
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
        throw new Error('You can only validate prizes for your spots');
      }
    }

    // Find user prize
    const userPrize = await prisma.userPrize.findUnique({
      where: { qrCode },
      include: {
        prize: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!userPrize) {
      throw new Error('Invalid QR code');
    }

    if (userPrize.isRedeemed) {
      throw new Error('Prize already redeemed');
    }

    // Check validity
    const now = new Date();
    if (userPrize.validUntil < now) {
      throw new Error('Prize has expired');
    }

    // Mark as redeemed
    const updatedPrize = await prisma.userPrize.update({
      where: { qrCode },
      data: {
        isRedeemed: true,
        redeemedAt: now,
      },
      include: {
        prize: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    console.log(`✅ Prize QR ${qrCode} validated by user ${user.id} at spot ${spotId || 'N/A'}`);

    return updatedPrize as UserPrizeType;
  }

  /**
   * Helper: Generate unique QR code
   */
  private generateQRCode(): string {
    return `PRIZE-${uuidv4().toUpperCase()}`;
  }
}
