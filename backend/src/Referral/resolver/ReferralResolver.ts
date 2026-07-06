import 'reflect-metadata'
import { Resolver, Query, Mutation, Ctx, Authorized, Arg } from 'type-graphql'
import { Context } from '../../shared/interface/Context'
import { Role } from '../../User/objectType/Role'
import { UserReferralCode } from '../objectType/UserReferralCode'
import { InvitedFriend } from '../objectType/InvitedFriend'
import { UseReferralCodeInput } from '../DTO/UseReferralCodeInput'
import { ErrorWithStatus } from '../../shared/interface/ErrorWithStatus'
import { CodeGenerator } from '../../shared/util/CodeGenerator'

// TODO: Add rate limiting for referral code generation
@Resolver()
export class ReferralResolver {
  @Authorized([Role.CLIENT, Role.OWNER, Role.COOPERATOR, Role.NEW_USER])
  @Query(() => UserReferralCode, { nullable: true })
  async getMyReferralCode(@Ctx() ctx: Context): Promise<UserReferralCode | null> {
    const { user } = ctx.req
    let referralCode = await ctx.prisma.userReferralCode.findUnique({
      where: { userId: user!.id },
      include: { user: true },
    })

    if (!referralCode) {
      const code = CodeGenerator.generateReferralCode(user!.email)
      referralCode = await ctx.prisma.userReferralCode.create({
        data: {
          userId: user!.id,
          code,
        },
        include: { user: true },
      })
    }

    return referralCode as UserReferralCode | null
  }

  @Authorized([Role.CLIENT, Role.OWNER, Role.COOPERATOR, Role.NEW_USER])
  @Query(() => [InvitedFriend])
  async getInvitedFriends(@Ctx() ctx: Context): Promise<InvitedFriend[]> {
    const { user } = ctx.req

    const referrals = await ctx.prisma.referral.findMany({
      where: { referrerId: user!.id },
      include: {
        referredUser: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return Promise.all(
      referrals.map(async (referral) => {
        let status = 'PENDING'
        let message: string | undefined

        if (referral.isCompleted) {
          if (referral.pointsAwarded === 5000) {
            status = 'MERCHANT_COMPLETED'
            message = 'Merchant successfully registered and created company'
          } else {
            status = 'CLIENT_COMPLETED'
            message = 'Client successfully registered and verified account'
          }
        } else {
          // Check if user registered as merchant but hasn't created company yet
          const user = referral.referredUser
          if (user.registrationSource === 'WEB_MERCHANT' || user.registrationSource === 'MOBILE_MERCHANT') {
            const hasCompany = await ctx.prisma.company.findUnique({
              where: { userId: user.id },
            })

            if (!hasCompany && user.emailVerified) {
              message = 'Merchant registered but company data not completed yet'
            }
          }
        }

        return {
          id: referral.id,
          name: referral.referredUser.name || referral.referredUser.email,
          email: referral.referredUser.email,
          avatarUrl: referral.referredUser.picture || '/images/avatar.webp',
          joinedDate: this.formatJoinedDate(referral.createdAt),
          points: referral.pointsAwarded,
          status,
          message,
        }
      })
    )
  }

  private formatJoinedDate(date: Date): string {
    const today = new Date()
    const timeDiff = Math.abs(today.getTime() - date.getTime())
    const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24))

    const options: Intl.DateTimeFormatOptions = {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }

    return daysDiff === 1
      ? `Today, ${date.toLocaleDateString('en-US', options)}`
      : date.toLocaleDateString('en-US', options)
  }
}
