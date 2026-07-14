import { Resolver, Query, Mutation, Arg, Ctx } from 'type-graphql'
import { Context } from '../shared/interface/Context'
import { ProfileSetupStatus, SaveFormDraftInput, ProfileSetupStep } from './types'

@Resolver()
export class ProfileSetupResolver {
  @Query(() => ProfileSetupStatus)
  async myProfileSetupStatus(@Ctx() ctx: Context): Promise<ProfileSetupStatus> {
    const userId = ctx.req.user?.id
    if (!userId) throw new Error('Not authenticated')

    const user = (await ctx.prisma.user.findUnique({
      where: { id: userId },
      include: {
        formDrafts: true,
        company: {
          include: {
            merchant: {
              include: {
                stores: true,
              },
            },
            subscription: true,
          },
        },
      },
    })) as any

    if (!user) throw new Error('User not found')

    let currentStep = 'COMPANY'
    const completedSteps: string[] = []

    if (user.company) {
      completedSteps.push('COMPANY')
      currentStep = 'MERCHANT'

      if (user.company.merchant) {
        completedSteps.push('MERCHANT')
        currentStep = 'STORE'

        if (user.company.merchant.stores.length > 0) {
          completedSteps.push('STORE')
          currentStep = 'SUBSCRIPTION'
        }

        if (user.company.subscription) {
          completedSteps.push('SUBSCRIPTION')
          currentStep = 'COMPLETED'
        }
      }
    }

    const isCompleted = currentStep === 'COMPLETED'

    await ctx.prisma.profileSetupProgress.upsert({
      where: { userId },
      create: {
        userId,
        currentStep: currentStep as any,
        completedSteps: completedSteps as any,
        isCompleted,
        lastActiveStep: currentStep as any,
      },
      update: {
        currentStep: currentStep as any,
        completedSteps: completedSteps as any,
        isCompleted,
        lastActiveStep: currentStep as any,
      },
    })

    const drafts = user.formDrafts.reduce((acc: any, draft: any) => {
      acc[draft.formType] = draft.formData
      return acc
    }, {})

    return {
      currentStep: currentStep as ProfileSetupStep,
      completedSteps: completedSteps as ProfileSetupStep[],
      isCompleted,
      hasCompany: !!user.company,
      hasMerchant: !!user.company?.merchant,
      hasStore: (user.company?.merchant?.stores.length || 0) > 0,
      hasSubscription: !!user.company?.subscription,
      companyDraft: drafts['COMPANY'] || null,
      merchantDraft: drafts['MERCHANT'] || null,
      storeDraft: drafts['MERCHANT_STORE'] || null,
    }
  }

  @Mutation(() => Boolean)
  async saveFormDraft(@Arg('input') input: SaveFormDraftInput, @Ctx() ctx: Context): Promise<boolean> {
    const userId = ctx.req.user?.id
    if (!userId) throw new Error('Not authenticated')

    await ctx.prisma.formDraft.upsert({
      where: {
        userId_formType: {
          userId,
          formType: input.formType as any,
        },
      },
      create: {
        userId,
        formType: input.formType as any,
        formData: input.formData,
        step: input.step as any,
      },
      update: {
        formData: input.formData,
        step: input.step as any,
      },
    })

    return true
  }

  @Mutation(() => Boolean)
  async clearFormDraft(@Arg('formType') formType: string, @Ctx() ctx: Context): Promise<boolean> {
    const userId = ctx.req.user?.id
    if (!userId) throw new Error('Not authenticated')

    await ctx.prisma.formDraft.deleteMany({
      where: {
        userId,
        formType: formType as any,
      },
    })

    return true
  }
}
