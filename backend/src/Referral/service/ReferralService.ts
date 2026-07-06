import prisma from '../../shared/prisma'
import { TransactionType } from '../../Points/objectType/PointTransaction'
import { v4 as uuidv4 } from 'uuid'

export class ReferralService {
  // Point amounts for different referral types
  private static readonly CLIENT_REFERRAL_POINTS = 2500 // Points for referring a client
  private static readonly MERCHANT_REFERRAL_POINTS = 5000 // Points for referring a merchant
  private static readonly REFERRAL_GRACE_PERIOD_DAYS = 30 // Grace period for account deletion

  /**
   * Award referral points when a referred user completes verification
   */
  static async awardReferralPoints(referredUserId: string, completionType: 'CLIENT_ACTIVE' | 'COMPANY_CREATED') {
    const referral = await prisma.referral.findUnique({
      where: { referredUserId },
      include: { referrer: true, referredUser: true },
    })

    if (!referral) {
      return // No referral to process
    }

    // Check if referral was already completed
    if (referral.isCompleted) {
      return // Referral already completed
    }

    // Check if this email was already rewarded before (prevent duplicate rewards for same email)
    const referredUserEmail = referral.referredUser.email
    const baseEmail = referredUserEmail.replace(/-google$|-facebook$/, '') // Remove OAuth suffixes

    const existingReward = await prisma.referral.findFirst({
      where: {
        referrerId: referral.referrerId,
        isCompleted: true,
        referredUser: {
          OR: [{ email: baseEmail }, { email: `${baseEmail}-google` }, { email: `${baseEmail}-facebook` }],
        },
      },
    })

    if (existingReward) {
      console.log(`⚠️ Email ${baseEmail} already rewarded - skipping duplicate referral`)
      return // Email already rewarded
    }

    // Award points based on completion type
    let pointsToAward: number
    let isUpgrade = false

    if (completionType === 'COMPANY_CREATED') {
      // User became a merchant
      if (referral.pointsAwarded > 0) {
        // User already received client points, award difference
        pointsToAward = this.MERCHANT_REFERRAL_POINTS - referral.pointsAwarded
        isUpgrade = true
      } else {
        // First time awarding points
        pointsToAward = this.MERCHANT_REFERRAL_POINTS
      }
    } else {
      // CLIENT_ACTIVE - only award if user doesn't have a company and hasn't received points yet
      const userCompany = await prisma.company.findUnique({
        where: { userId: referredUserId },
      })

      if (userCompany || referral.pointsAwarded > 0) {
        // User already has a company or already received points
        return
      }

      pointsToAward = this.CLIENT_REFERRAL_POINTS
    }

    // Award points in a transaction
    await prisma.$transaction(async (tx) => {
      // Update referral record
      await tx.referral.update({
        where: { id: referral.id },
        data: {
          pointsAwarded: isUpgrade ? this.MERCHANT_REFERRAL_POINTS : pointsToAward,
          isCompleted: true,
        },
      })

      // Find or create point balance for referrer
      let balance = await tx.userPointBalance.findUnique({
        where: { userId: referral.referrerId },
      })

      if (!balance) {
        balance = await tx.userPointBalance.create({
          data: {
            id: uuidv4(),
            userId: referral.referrerId,
            totalPoints: 0,
            availablePoints: 0,
            lockedPoints: 0,
          },
        })
      }

      const balanceBefore = balance.availablePoints
      const balanceAfter = balanceBefore + pointsToAward

      // Create point transaction
      const description = isUpgrade
        ? `Referral bonus upgrade for ${referral.referredUser.email} (CLIENT → MERCHANT)`
        : completionType === 'CLIENT_ACTIVE'
        ? `Referral bonus for ${referral.referredUser.email} (CLIENT)`
        : `Referral bonus for ${referral.referredUser.email} (MERCHANT)`

      await tx.pointTransaction.create({
        data: {
          id: uuidv4(),
          userId: referral.referrerId,
          type: TransactionType.EARNED,
          amount: pointsToAward,
          description,
          referenceId: referral.id,
          referenceType: 'REFERRAL',
          balanceBefore,
          balanceAfter,
        },
      })

      // Update point balance
      await tx.userPointBalance.update({
        where: { userId: referral.referrerId },
        data: {
          totalPoints: { increment: pointsToAward },
          availablePoints: { increment: pointsToAward },
        },
      })
    })

    console.log(`✅ Awarded ${pointsToAward} referral points to ${referral.referrer.email} for ${completionType}`)
  }

  /**
   * Handle account deletion - reverse referral points if within grace period
   */
  static async handleAccountDeletion(deletedUserId: string) {
    const referral = await prisma.referral.findUnique({
      where: { referredUserId: deletedUserId },
      include: { referrer: true, referredUser: true },
    })

    if (!referral || !referral.isCompleted) {
      return // No completed referral to process
    }

    // Check if within grace period
    const daysSinceReward = (Date.now() - referral.updatedAt.getTime()) / (1000 * 60 * 60 * 24)

    if (daysSinceReward <= this.REFERRAL_GRACE_PERIOD_DAYS) {
      await this.reverseReferralPoints(referral)
      console.log(
        `⚠️ Reversed ${referral.pointsAwarded} referral points - ${referral.referredUser.email} deleted account within grace period`
      )
    }
  }

  /**
   * Reverse referral points when account is deleted within grace period
   */
  private static async reverseReferralPoints(referral: any) {
    await prisma.$transaction(async (tx) => {
      // Get current balance
      const balance = await tx.userPointBalance.findUnique({
        where: { userId: referral.referrerId },
      })

      if (!balance) return

      const balanceBefore = balance.availablePoints
      const balanceAfter = Math.max(0, balanceBefore - referral.pointsAwarded) // Prevent negative balance
      const actualDeduction = balanceBefore - balanceAfter

      // Create PENALTY transaction
      await tx.pointTransaction.create({
        data: {
          id: uuidv4(),
          userId: referral.referrerId,
          type: TransactionType.PENALTY,
          amount: -actualDeduction,
          description: `Referral reversed - ${referral.referredUser.email} deleted account`,
          referenceId: referral.id,
          referenceType: 'REFERRAL_REVERSAL',
          balanceBefore,
          balanceAfter,
        },
      })

      // Update balance
      await tx.userPointBalance.update({
        where: { userId: referral.referrerId },
        data: {
          totalPoints: { decrement: actualDeduction },
          availablePoints: { decrement: actualDeduction },
        },
      })

      // Mark referral as reversed
      await tx.referral.update({
        where: { id: referral.id },
        data: {
          isCompleted: false,
          pointsAwarded: 0,
        },
      })
    })
  }
}
