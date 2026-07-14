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
import { SubscriptionPlan } from '../objectType/SubscriptionPlan'
import { SubscriptionPlanInput } from '../DTO/SubscriptionPlanInput'
import { ErrorWithStatus } from '../../shared/interface/ErrorWithStatus'

@Resolver(SubscriptionPlan)
export class SubscriptionPlanResolver {
  @Authorized([Role.ADMIN])
  @Mutation(() => SubscriptionPlan)
  async createSubscriptionPlan(@Arg('data') subscriptionPlanInput: SubscriptionPlanInput, @Ctx() ctx: Context) {
    const { paymentCode, name, mostPopular, privatePlan, description, amountMembers } = subscriptionPlanInput

    const plan = await ctx.prisma.plan.create({
      data: {
        paymentCode,
        name,
        mostPopular,
        privatePlan,
        description,
        amountMembers,
      },
    })
    return plan
  }

  @Authorized([Role.ADMIN])
  @Query(() => [SubscriptionPlan])
  async subscriptionPlansByAdmin(@Ctx() ctx: Context) {
    return ctx.prisma.plan.findMany()
  }

  @Authorized([Role.ADMIN, Role.OWNER])
  @Query(() => [SubscriptionPlan])
  async subscriptionPlans(@Ctx() ctx: Context) {
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

    const plans = await ctx.prisma.plan.findMany({
      where: {
        privatePlan: { equals: false },
      },
    })

    if (!hasFreePlan) {
      return plans
    }

    return plans.filter((plan) => plan.paymentCode !== 'free')
  }

  @Authorized([Role.ADMIN, Role.OWNER])
  @Query(() => SubscriptionPlan)
  async subscriptionPlan(@Arg('paymentCode') paymentCode: string, @Ctx() ctx: Context) {
    return ctx.prisma.plan.findFirst({
      where: {
        OR: [{ id: paymentCode }, { paymentCode }],
      },
    })
  }

  @Authorized([Role.ADMIN, Role.OWNER])
  @Query(() => [SubscriptionPlan])
  async getSubscriptionPlansByIds(@Arg('ids', () => [String]) ids: string[], @Ctx() ctx: Context) {
    return ctx.prisma.plan.findMany({
      where: {
        paymentCode: {
          in: ids,
        },
      },
    })
  }
}
