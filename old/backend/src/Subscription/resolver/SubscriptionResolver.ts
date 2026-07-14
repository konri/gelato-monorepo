import {
  Arg,
  Authorized,
  Ctx,
  Field,
  FieldResolver,
  Float,
  InputType,
  Int,
  Mutation,
  Query,
  Resolver,
  Root,
} from 'type-graphql'
import i18next from 'i18next'
import { Context } from '../../shared/interface/Context'
import { Role } from '../../User/objectType/Role'
import { ErrorWithStatus } from '../../shared/interface/ErrorWithStatus'
import { PromoCode } from '../objectType/PromoCode'
import { PromoCodeInput } from '../DTO/PromoCodeInput'
import { getVoucherByCode, setVoucherToAccount } from '../../Voucher/service/voucher.service'
import { SubscriptionCompanyInput } from '../DTO/SubscriptionCompanyInput'
import { SubscriptionPlan } from '../objectType/SubscriptionPlan'
import { SubscriptionCompanyRevenueCatInput } from '../DTO/SubscriptionCompanyRevenueCatInput'
import { sendNotificationForUser } from '../../shared/service/notifications'
import { NotificationType } from '../../shared/interface/NotificationType'
import { SubscriptionCompany } from '../objectType/SubscriptionCompany'
import { EnterpriseFormInput } from '../DTO/EnterpriseFormInput'
import { sendEmail } from '../../shared/service/emailGeneration.service'
import { EnterpriseForm } from '../objectType/EnterpriseForm'
import { EnterpriseRenewSubscriptionInput } from '../DTO/EnterpriseRenewSubscriptionInput'
import { EnterpriseRenewSubscription } from '../objectType/EnterpriseRenewSubscription'

@Resolver(SubscriptionCompany)
export class SubscriptionResolver {
  @Authorized([Role.OWNER])
  @Query(() => SubscriptionCompany)
  async getMyCompanySubscription(@Ctx() ctx: Context) {
    const company = await ctx.prisma.company.findFirst({
      where: {
        userId: ctx.req.user?.id,
      },
    })

    if (!company) {
      throw new ErrorWithStatus(500, 'Company not found')
    }

    return ctx.prisma.subscriptionCompany.findFirst({
      where: {
        companyId: company.id,
      },
      include: {
        plan: true,
      },
    })
  }

  /**
   * Set subscription to the user, ex. after payment invoice is paid
   * @param subscriptionUserInput
   * @param ctx
   */
  @Authorized([Role.ADMIN])
  @Mutation(() => SubscriptionCompany)
  async setSubscriptionPlan(@Arg('data') subscriptionUserInput: SubscriptionCompanyInput, @Ctx() ctx: Context) {
    const { companyId, planId, amountMonths, startDate } = subscriptionUserInput

    const plan = await ctx.prisma.plan.findFirst({
      where: {
        id: planId,
      },
    })

    if (plan == null) {
      return new ErrorWithStatus(500, 'Plan is not exist')
    }

    const company = await ctx.prisma.company.findFirst({
      where: {
        id: companyId,
      },
    })

    if (company == null) {
      return new ErrorWithStatus(500, 'Company is not exist')
    }

    const startDateParsed = startDate ? new Date(startDate).toISOString() : new Date().toISOString()
    const subscription = await ctx.prisma.subscriptionCompany.findFirst({
      where: {
        companyId,
      },
    })
    const endDate = new Date(new Date().setMonth(new Date(startDateParsed).getMonth() + amountMonths))

    await ctx.prisma.historySubscriptionCompany.create({
      data: {
        startDate: startDateParsed,
        endDate,
        company: { connect: { id: companyId } },
        plan: { connect: { id: planId } },
      },
    })
    if (subscription) {
      return ctx.prisma.subscriptionCompany.update({
        data: {
          startDate: this.parseDateForTimezone(startDateParsed),
          endDate: this.parseDateForTimezone(endDate),
          plan: { connect: { id: planId } },
        },
        where: {
          companyId,
        },
      })
    }
    return ctx.prisma.subscriptionCompany.create({
      data: {
        startDate: this.parseDateForTimezone(startDateParsed),
        endDate: this.parseDateForTimezone(endDate),
        firstSeen: this.parseDateForTimezone(startDateParsed),
        company: { connect: { id: companyId } },
        plan: { connect: { id: planId } },
      },
    })

    // todo: send notification to company owner that sub is active
  }

  @Authorized([Role.OWNER])
  @Mutation(() => SubscriptionCompany)
  async setFreePlan(@Ctx() ctx: Context) {
    const company = await ctx.prisma.company.findFirst({
      where: {
        userId: ctx.req.user?.id,
      },
    })

    if (!company) {
      throw new ErrorWithStatus(500, 'Company not found')
    }

    const hasFreePlan = await ctx.prisma.historySubscriptionCompany.findFirst({
      where: {
        companyId: company.id,
        plan: {
          paymentCode: 'free',
        },
      },
    })

    if (hasFreePlan) {
      throw new ErrorWithStatus(500, 'Company already has free plan')
    }

    const freePlan = await ctx.prisma.plan.findFirst({
      where: {
        paymentCode: 'free',
      },
    })

    if (!freePlan) {
      throw new ErrorWithStatus(500, 'Free plan not found')
    }

    const startDate = new Date()
    const endDate = new Date(startDate.getTime())
    endDate.setMonth(endDate.getMonth() + 1)
    await ctx.prisma.historySubscriptionCompany.create({
      data: {
        startDate: this.parseDateForTimezone(startDate.toISOString()),
        endDate: this.parseDateForTimezone(endDate),
        company: { connect: { id: company.id } },
        plan: { connect: { id: freePlan.id } },
      },
    })
    return ctx.prisma.subscriptionCompany.create({
      data: {
        startDate: this.parseDateForTimezone(startDate.toISOString()),
        endDate: this.parseDateForTimezone(endDate),
        firstSeen: this.parseDateForTimezone(startDate.toISOString()),
        company: { connect: { id: company.id } },
        plan: { connect: { id: freePlan.id } },
        store: 'free',
      },
    })
  }

  @Authorized([Role.OWNER])
  @Mutation(() => SubscriptionCompany)
  async getMySubscription(@Ctx() ctx: Context) {
    const company = await ctx.prisma.company.findFirst({
      where: {
        userId: ctx.req.user?.id,
      },
    })

    if (!company) {
      throw new ErrorWithStatus(500, 'Company not found')
    }
    return ctx.prisma.subscriptionCompany.findFirst({
      where: {
        companyId: company.id,
      },
    })
  }

  @Authorized([Role.OWNER])
  @Mutation(() => SubscriptionCompany)
  async updateSubscriptionFromStore(
    @Arg('data') subscriptionUserInput: SubscriptionCompanyRevenueCatInput,
    @Ctx() ctx: Context
  ) {
    const {
      startDate,
      endDate: endDateFromRC,
      originalAppUserId,
      paymentId,
      store,
      firstSeen,
      promoCode,
      identifier,
      autoRenewal,
    } = subscriptionUserInput

    const plan = await ctx.prisma.plan.findFirst({
      where: {
        paymentCode: paymentId,
      },
    })

    if (plan == null) {
      return new ErrorWithStatus(500, 'Plan does not exist')
    }

    const user = await ctx.prisma.user.findFirst({
      where: {
        id: ctx.req.user?.id,
      },
      include: {
        company: true,
      },
    })

    if (user == null) {
      return new ErrorWithStatus(500, 'User does not exist')
    }

    if (user.company == null) {
      return new ErrorWithStatus(500, 'Company does not exist for user')
    }

    const startDateParsed = startDate ? new Date(startDate).toISOString() : new Date().toISOString()
    const endDate = new Date(endDateFromRC).toISOString()

    const subscription = await ctx.prisma.subscriptionCompany.findFirst({
      where: {
        companyId: user.company.id,
      },
    })

    const isDataChanged =
      !subscription ||
      new Date(subscription.startDate).toISOString() !== startDateParsed ||
      new Date(subscription.endDate).toISOString() !== endDate ||
      subscription.originalAppUserId !== originalAppUserId ||
      subscription.store !== store ||
      subscription.planId !== plan.id

    if (!isDataChanged) {
      return subscription
    }

    sendNotificationForUser(user.id, undefined, {
      title: i18next.t(`notification.${NotificationType.SET_SUBSCRIPTION}.title`, { lng: user.language }),
      body: i18next.t(`notification.${NotificationType.SET_SUBSCRIPTION}.body`, {
        startDate,
        endDate,
        lng: user.language,
      }),
    })

    if (subscription) {
      await ctx.prisma.historySubscriptionCompany.create({
        data: {
          startDate: subscription.startDate,
          endDate: subscription.endDate,
          promoCode,
          originalAppUserId,
          identifier,
          autoRenewal,
          company: { connect: { id: user.company.id } },
          plan: { connect: { id: subscription.planId } },
        },
      })

      return ctx.prisma.subscriptionCompany.update({
        data: {
          startDate: this.parseDateForTimezone(startDateParsed),
          endDate: this.parseDateForTimezone(endDate),
          originalAppUserId,
          store,
          plan: { connect: { id: plan.id } },
        },
        where: {
          companyId: user.company.id,
        },
        include: {
          plan: true,
        },
      })
    }

    await ctx.prisma.historySubscriptionCompany.create({
      data: {
        startDate: this.parseDateForTimezone(startDateParsed),
        endDate: this.parseDateForTimezone(endDate),
        promoCode,
        originalAppUserId,
        identifier,
        autoRenewal,
        company: { connect: { id: user.company.id } },
        plan: { connect: { id: plan.id } },
      },
    })

    return ctx.prisma.subscriptionCompany.create({
      data: {
        startDate: this.parseDateForTimezone(startDateParsed),
        endDate: this.parseDateForTimezone(endDate),
        firstSeen: this.parseDateForTimezone(firstSeen),
        promoCode,
        originalAppUserId,
        store,
        identifier,
        autoRenewal,
        company: { connect: { id: user.company.id } },
        plan: { connect: { id: plan.id } },
      },
      include: {
        plan: true,
      },
    })
  }

  @Authorized(Role.ADMIN)
  @Mutation(() => PromoCode)
  createPromoCode(@Arg('data') promoCode: PromoCodeInput, @Ctx() ctx: Context) {
    return ctx.prisma.promoCode.create({
      data: {
        ...promoCode,
      },
    })
  }

  @Authorized(Role.ADMIN)
  @Query(() => [PromoCode])
  getAllPromoCode(@Ctx() ctx: Context) {
    return ctx.prisma.promoCode.findMany()
  }

  @Authorized([Role.OWNER])
  @Query(() => [SubscriptionPlan])
  async getSubscriptionPlans(@Arg('code', { nullable: true }) code: string, @Ctx() ctx: Context) {
    if (code && code.length > 0) {
      return ctx.prisma.plan.findMany({
        where: {
          paymentCode: code,
        },
      })
    }
    return ctx.prisma.plan.findMany()
  }

  @Mutation(() => EnterpriseForm)
  async enterpriseFormRequest(@Arg('data') data: EnterpriseFormInput, @Ctx() ctx: Context) {
    const { name, surname, company, email, mobile, amountProjects, amountUsers, message } = data
    const user = await ctx.prisma.user.findFirst({
      where: {
        id: ctx.req.user?.id,
      },
    })
    const enterpriseForm = await ctx.prisma.enterpriseForm.create({
      data: {
        name,
        surname,
        company,
        email,
        mobile,
        amountUsers,
        message,
        user: {
          connect: {
            id: ctx.req.user?.id,
          },
        },
      },
    })
    const templateVars = {
      id: enterpriseForm.id,
      name,
      surname,
      company,
      email,
      mobile,
      amountUsers,
      message,
    }

    sendEmail('enterprise/client', templateVars, email, 'offerDetailsClient', user?.language || 'en')
    sendEmail('enterprise/reminder', templateVars, process.env.FEEDBACK_TO!, 'offerDetailsReminder', 'pl')
    return enterpriseForm
  }

  @Authorized([Role.OWNER, Role.COOPERATOR, Role.CLIENT])
  @Mutation(() => EnterpriseRenewSubscription)
  async requestRenewSubscription(@Arg('data') data: EnterpriseRenewSubscriptionInput, @Ctx() ctx: Context) {
    const { companyId, email, message, projectId } = data
    const user = await ctx.prisma.user.findFirst({
      where: {
        id: ctx.req.user?.id,
      },
    })

    const company = await ctx.prisma.company.findFirst({
      where: {
        id: companyId,
      },
      include: {
        companyOwner: { include: { user: true } },
      },
    })


    if (!company) {
      throw new ErrorWithStatus(404, 'Company not found')
    }

    if (!user) {
      throw new ErrorWithStatus(404, 'User not found')
    }

    const enterpriseFormRenewSubscription = await ctx.prisma.enteriseFormRenewSubscription.create({
      data: {
        company: { connect: { id: companyId } },
        user: { connect: { id: user.id } },
        email,
        message,
      },
    })

    const titleKey = `notification.REQUEST_RENEW_SUBSCRIPTION.title`
    const bodyKey = `notification.REQUEST_RENEW_SUBSCRIPTION.body`

    sendNotificationForUser(company.companyOwner!.user.id, user.id, {
      title: i18next.t(titleKey, { lng: user?.language }),
      body: i18next.t(bodyKey, {
        userName: user.name,
        lng: user?.language,
      }),
      additionalParams: {
        type: NotificationType.REQUEST_RENEW_SUBSCRIPTION,
        id: user.id,
      },
    })

    const templateVars = {
      id: enterpriseFormRenewSubscription.id,
      email,
      message,
      name: company?.companyOwner?.user?.name || '',
      companyName: company.name,
      requestUserName: user.name,
    }

    await sendEmail(
      'enterprise/renewSubscribeCompany',
      templateVars,
      company?.companyOwner?.user?.email || company?.email || process.env.FEEDBACK_TO!,
      'subscriptionRequest',
      company?.companyOwner?.user?.language || 'EN'
    )
    await sendEmail('enterprise/renewSubscribeAcknowledge', templateVars, email, 'requestAcknowledged', user.language)
    return enterpriseFormRenewSubscription
  }

  @Authorized([Role.OWNER])
  @Query(() => PromoCode)
  async useCode(@Arg('code') code: string, @Ctx() ctx: Context) {
    const promoCode = await ctx.prisma.promoCode.findFirst({
      where: {
        code,
      },
    })

    if (promoCode) {
      return promoCode
    }
    const voucher = await getVoucherByCode(code, ctx)
    if (voucher) {
      await setVoucherToAccount(voucher, ctx)
      return {
        id: voucher.id,
        code,
        paymentCode: code,
        name: 'Voucher',
        description: 'Voucher',
        isVoucher: true,
      }
    }
    throw new ErrorWithStatus(400, 'Bad code')
  }

  private parseDateForTimezone(date: string | Date): Date {
    const parsedAvailableDate = new Date(date)
    const userTimezoneOffset = parsedAvailableDate?.getTimezoneOffset() * 60000
    return new Date(parsedAvailableDate.getTime() - userTimezoneOffset)
  }
}
