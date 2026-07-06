import 'reflect-metadata'
import { Resolver, Query, Mutation, Arg, Ctx, FieldResolver, Root, Authorized, ObjectType, Int } from 'type-graphql'
import { User } from '../objectType/User'
import { Context } from '../../shared/interface/Context'
import { Role } from '../objectType/Role'
import { ChangeLangInput } from '../DTO/ChangeLangInput'
import { UserChangeInput } from '../DTO/UserChangeInput'
import { ChangeEmailInput } from '../DTO/ChangeEmailInput'

import { ErrorWithStatus } from '../../shared/interface/ErrorWithStatus'
import { getEmailWithOld } from '../utils/email'
import { UserWithExtraId } from '../objectType/UserWithExtraId'
import { sendEmail } from '../../shared/service/emailGeneration.service'
import { CodeGenerator } from '../../shared/util/CodeGenerator'
import { MerchantAccessService } from '../../shared/service/MerchantAccessService'
import type { OperatorMerchantScope } from '../../shared/service/MerchantAccessService'
import { OperatorCapabilitiesMapper } from '../../shared/mappers/OperatorCapabilitiesMapper'
import { OperatorCapabilities } from '../objectType/OperatorCapabilities'
import { RegistrationSource } from '@prisma/client'

const OPERATOR_CAPABILITIES_ROLES: Role[] = [Role.NEW_USER, Role.OWNER, Role.CLIENT, Role.COOPERATOR, Role.ADMIN]

const SELF_ACCOUNT_ROLES: Role[] = [Role.NEW_USER, Role.OWNER, Role.CLIENT, Role.COOPERATOR]

const SELF_ACCOUNT_WITH_ADMIN_ROLES: Role[] = [Role.NEW_USER, Role.CLIENT, Role.OWNER, Role.COOPERATOR, Role.ADMIN]

@Resolver(User)
export class UserResolver {
  @Authorized(Role.ADMIN)
  @Query(() => [User])
  users(@Ctx() ctx: Context) {
    return ctx.prisma.user.findMany()
  }

  @Authorized([Role.OWNER, Role.COOPERATOR, Role.ADMIN])
  @Query(() => [User])
  async searchUsersByEmail(
    @Arg('email') email: string,
    @Arg('limit', () => Int, { nullable: true }) limit: number | undefined,
    @Ctx() ctx: Context
  ) {
    const search = email.trim()
    if (search.length < 3) {
      return []
    }

    return ctx.prisma.user.findMany({
      where: {
        AND: [
          { NOT: { roles: { has: Role.DISACTIVE } } },
          {
            OR: [
              { email: { contains: search, mode: 'insensitive' } },
              { firstName: { contains: search, mode: 'insensitive' } },
              { surname: { contains: search, mode: 'insensitive' } },
              { name: { contains: search, mode: 'insensitive' } },
            ],
          },
        ],
      },
      take: limit ?? 8,
    })
  }

  @Authorized(SELF_ACCOUNT_ROLES)
  @Mutation(() => User)
  async deleteAccount(@Ctx() ctx: Context) {
    const { user } = ctx.req

    // Handle referral point reversal if within grace period
    const { ReferralService } = await import('../../Referral/service/ReferralService')
    await ReferralService.handleAccountDeletion(user!.id)

    return ctx.prisma.user.update({
      data: {
        roles: [Role.DISACTIVE],
      },
      where: {
        id: user!.id,
      },
    })
  }

  @Authorized(SELF_ACCOUNT_ROLES)
  @Mutation(() => User)
  async changeLang(@Arg('data') data: ChangeLangInput, @Ctx() ctx: Context) {
    const { user } = ctx.req

    return ctx.prisma.user.update({
      data: {
        language: data.code,
      },
      where: {
        id: user!.id,
      },
    })
  }

  @Authorized(SELF_ACCOUNT_ROLES)
  @Mutation(() => User)
  async updatePermissions(
    @Arg('locationPermission', { nullable: true }) locationPermission?: boolean,
    @Arg('notificationPermission', { nullable: true }) notificationPermission?: boolean,
    @Arg('preferredCity', { nullable: true }) preferredCity?: string,
    @Ctx() ctx?: Context
  ) {
    const { user } = ctx!.req

    return ctx!.prisma.user.update({
      data: {
        locationPermission,
        notificationPermission,
        preferredCity,
      },
      where: {
        id: user!.id,
      },
    })
  }

  @Authorized(SELF_ACCOUNT_ROLES)
  @Mutation(() => User)
  async updateProfile(@Arg('data') data: UserChangeInput, @Ctx() ctx: Context) {
    const { user } = ctx.req
    const { name, firstName, surname, phone, birthDate, picture, referralCode } = data

    // If firstName/surname provided, use them; otherwise extract from name
    const finalFirstName = firstName || name?.split(' ')?.[0] || undefined
    const finalSurname = surname || name?.split(' ')?.[1] || undefined

    // Handle referral code only for first-time OAuth users
    if (referralCode) {
      const currentUser = await ctx.prisma.user.findUnique({
        where: { id: user!.id },
      })

      // Only allow referral code if user is first-time OAuth user
      if (currentUser?.isFirstTimeGoogleLogin && currentUser?.profileType !== 'local') {
        const referralCodeRecord = await ctx.prisma.userReferralCode.findUnique({
          where: { code: referralCode },
        })

        if (referralCodeRecord && referralCodeRecord.userId !== user!.id) {
          // Check if this email was already referred before
          const baseEmail = currentUser.email.replace(/-google$|-facebook$/, '')
          const existingReferral = await ctx.prisma.referral.findFirst({
            where: {
              referrerId: referralCodeRecord.userId,
              referredUser: {
                OR: [{ email: baseEmail }, { email: `${baseEmail}-google` }, { email: `${baseEmail}-facebook` }],
              },
            },
          })

          if (!existingReferral) {
            // Create referral relationship
            await ctx.prisma.referral.create({
              data: {
                referrerId: referralCodeRecord.userId,
                referredUserId: user!.id,
                referralCode: referralCode,
                pointsAwarded: 0,
                isCompleted: false,
              },
            })

            // Award referral points
            const { ReferralService } = await import('../../Referral/service/ReferralService')
            await ReferralService.awardReferralPoints(user!.id, 'CLIENT_ACTIVE')
          }
        }
      }
    }

    // Update user profile and disable first-time flag
    return ctx.prisma.user.update({
      data: {
        name,
        firstName: finalFirstName,
        surname: finalSurname,
        phone,
        birthDate,
        picture,
        isFirstTimeGoogleLogin: false, // Disable after first profile update
      },
      where: {
        id: user!.id,
      },
    })
  }

  @Authorized(SELF_ACCOUNT_ROLES)
  @Mutation(() => String)
  async requestEmailChange(@Arg('data') data: ChangeEmailInput, @Ctx() ctx: Context) {
    const { user } = ctx.req
    const { newEmail } = data
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if (!regex.test(newEmail)) {
      throw new ErrorWithStatus(400, 'Invalid email format')
    }

    // Check if email is already taken
    const existingUser = await ctx.prisma.user.findFirst({
      where: { email: newEmail.toLowerCase().trim() },
    })

    if (existingUser) {
      throw new ErrorWithStatus(400, 'Email address is already in use')
    }

    // Only allow email change for local accounts
    if (user?.profileType !== 'local') {
      throw new ErrorWithStatus(400, 'Email change is not allowed for OAuth accounts')
    }

    // Delete old email change requests
    await ctx.prisma.emailVerification.deleteMany({
      where: { userId: user!.id },
    })

    // Generate verification code
    const verificationCode = CodeGenerator.generateVerificationCode()

    // Store new email in EmailVerification table temporarily
    await ctx.prisma.emailVerification.create({
      data: {
        userId: user!.id,
        code: verificationCode,
      },
    })

    // Send verification email to NEW email address
    const templateVars = {
      user_name: user!.name || 'User',
      verification_code: verificationCode,
      new_email: newEmail,
    }

    try {
      await sendEmail('email-change-verification', templateVars, newEmail, 'emailChangeVerification', 'pl')
    } catch (error) {
      console.error('Email sending failed:', error)
      throw new ErrorWithStatus(500, 'Failed to send verification email')
    }

    return 'Verification email has been sent to the new address'
  }

  @Authorized(SELF_ACCOUNT_ROLES)
  @Mutation(() => User)
  async confirmEmailChange(@Arg('newEmail') newEmail: string, @Arg('code') code: string, @Ctx() ctx: Context) {
    const { user } = ctx.req
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if (!regex.test(newEmail)) {
      throw new ErrorWithStatus(400, 'Invalid email format')
    }

    // Find verification record
    const verification = await ctx.prisma.emailVerification.findFirst({
      where: {
        userId: user!.id,
        code: code.trim(),
      },
    })

    if (!verification) {
      throw new ErrorWithStatus(400, 'Invalid verification code')
    }

    // Check if code is not older than 24 hours
    const hoursSinceCreated = (Date.now() - verification.createdAt.getTime()) / (1000 * 60 * 60)
    if (hoursSinceCreated > 24) {
      await ctx.prisma.emailVerification.delete({ where: { id: verification.id } })
      throw new ErrorWithStatus(400, 'Verification code has expired')
    }

    // Check if email is still available
    const existingUser = await ctx.prisma.user.findFirst({
      where: { email: newEmail.toLowerCase().trim() },
    })

    if (existingUser) {
      throw new ErrorWithStatus(400, 'Email address is already in use')
    }

    // Update user email
    const updatedUser = await ctx.prisma.user.update({
      where: { id: user!.id },
      data: { email: newEmail.toLowerCase().trim() },
    })

    // Delete verification record
    await ctx.prisma.emailVerification.delete({ where: { id: verification.id } })

    return updatedUser
  }

  @Authorized([Role.NEW_USER, Role.OWNER, Role.CLIENT, Role.COOPERATOR, Role.ADMIN])
  @Query(() => User)
  async whoAmI(@Ctx() ctx: Context) {
    if (!ctx.req.user?.id) {
      throw new ErrorWithStatus(401, 'You are not logged in')
    }

    const user = await ctx.prisma.user.findFirst({
      where: {
        id: ctx.req.user.id,
      },
    })

    if (!user) {
      throw new ErrorWithStatus(404, 'User not found')
    }

    return user
  }

  @Authorized(OPERATOR_CAPABILITIES_ROLES)
  @Query(() => OperatorCapabilities)
  async myOperatorCapabilities(@Ctx() ctx: Context): Promise<OperatorCapabilities> {
    const requestUser = ctx.req.user
    if (!requestUser) {
      throw new ErrorWithStatus(401, 'You are not logged in')
    }

    const dbUser = await ctx.prisma.user.findUnique({
      where: { id: requestUser.id },
      select: { roles: true },
    })
    if (!dbUser) {
      throw new ErrorWithStatus(404, 'User not found')
    }

    const roles = [...dbUser.roles]
    if (roles.includes(Role.ADMIN)) {
      const merchants = await ctx.prisma.merchant.findMany({
        select: { id: true },
      })
      const adminScopes: OperatorMerchantScope[] = merchants.map((merchant) => ({
        merchantId: merchant.id,
        scopeMode: 'FULL_MERCHANT',
        permissions: MerchantAccessService.OWNER_PERMISSIONS,
        storeScopeAll: true,
        storeIds: [],
      }))
      return OperatorCapabilitiesMapper.toAdminGraphQL(roles, adminScopes)
    }

    const merchantAccessService = new MerchantAccessService(ctx.prisma)
    const scopes = await merchantAccessService.resolveOperatorMerchantScopes(requestUser.id, roles)
    return OperatorCapabilitiesMapper.toGraphQL(roles, scopes)
  }

  @Authorized(SELF_ACCOUNT_WITH_ADMIN_ROLES)
  @Query(() => Boolean)
  async needsCompanyRegistration(@Ctx() ctx: Context): Promise<boolean> {
    const user = ctx.req.user!

    if (user.roles.includes(Role.OWNER)) {
      return false
    }

    if (user.roles.includes(Role.CLIENT) && !user.roles.includes(Role.OWNER)) {
      return true
    }

    if (user.roles.includes(Role.NEW_USER)) {
      const dbUser = await ctx.prisma.user.findUnique({
        where: { id: user.id },
        select: { registrationSource: true },
      })
      if (
        dbUser?.registrationSource === RegistrationSource.WEB_MERCHANT ||
        dbUser?.registrationSource === RegistrationSource.MOBILE_MERCHANT
      ) {
        return true
      }
    }

    return false
  }

  @Authorized(SELF_ACCOUNT_WITH_ADMIN_ROLES)
  @Query(() => UserWithExtraId)
  async getMyUserDetails(@Ctx() ctx: Context) {
    let user: any = await ctx.prisma.user.findFirst({
      where: {
        id: ctx.req.user?.id,
      },
    })

    if (user?.roles.includes(Role.COOPERATOR)) {
      const cooperator = await ctx.prisma.cooperator.findFirst({
        where: {
          userId: user?.id,
        },
      })
      return {
        ...user,
        id: cooperator?.id,
        userId: user.id,
      }
    } else if (user?.roles.includes(Role.OWNER)) {
      const owner = await ctx.prisma.companyOwner.findFirst({
        where: {
          userId: user?.id,
        },
      })
      return {
        ...user,
        id: owner?.id,
        userId: user.id,
      }
    } else if (user?.roles.includes(Role.CLIENT)) {
      const client = await ctx.prisma.client.findFirst({
        where: {
          userId: user?.id,
        },
      })
      return {
        ...user,
        id: client?.id,
        userId: user.id,
      }
    } else {
      return user
    }
  }

  @Authorized([Role.OWNER, Role.ADMIN])
  @Query(() => UserWithExtraId)
  async getUserById(@Arg('id') id: string, @Ctx() ctx: Context) {
    const cooperator = await ctx.prisma.cooperator.findFirst({
      where: {
        id,
      },
      include: { user: true },
    })
    if (cooperator) {
      return {
        ...cooperator.user,
        id: cooperator.id,
        userId: cooperator.userId,
      }
    }

    const owner = await ctx.prisma.companyOwner.findFirst({
      where: {
        id,
      },
      include: { user: true },
    })

    if (owner) {
      return {
        ...owner.user,
        id: owner.id,
        userId: owner.userId,
      }
    }

    const client = await ctx.prisma.client.findFirst({
      where: {
        id,
      },
      include: { user: true },
    })
    if (client) {
      return {
        ...client.user,
        id: client.id,
        userId: client.userId,
      }
    }

    const user = await ctx.prisma.user.findFirst({
      where: {
        id,
      },
    })

    if (user) {
      return {
        ...user,
        id: user.id,
        userId: user.id,
      }
    }

    throw new ErrorWithStatus(404, 'User not found')
  }

  @Authorized(SELF_ACCOUNT_ROLES)
  @Mutation(() => User)
  async removeProfile(@Ctx() ctx: Context) {
    const { user } = ctx.req
    const oldUser = await ctx.prisma.user.findFirst({
      where: {
        id: user!.id,
      },
    })

    return ctx.prisma.user.update({
      data: {
        name: 'Account deleted',
        firstName: 'account',
        surname: 'deleted',
        phone: '',
        birthDate: new Date('01/01/1970'),
        picture: process.env.REMOVED_ACCOUNT_AVATAR || '',
        email: getEmailWithOld(oldUser!.email),
        password: process.env.REMOVED_PASSWORD,
        aditionalEmial: getEmailWithOld(oldUser!.aditionalEmial || oldUser!.email),
      },
      where: {
        id: user!.id,
      },
    })
  }
}
