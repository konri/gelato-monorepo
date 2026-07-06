import { Arg, Authorized, Ctx, Field, Mutation, ObjectType, Query, Resolver } from 'type-graphql'

import { Prisma as PrismaDTO } from '@prisma/client'
import sgMail from '@sendgrid/mail'
import i18next from 'i18next'
import { generateJWT } from '../../Auth/PasswordUtil'
import { Cooperator } from '../../Cooperator/objectType/Cooperator'
import {
  CooperatorInvitation,
  CooperatorInvitationCreateResult,
} from '../../Cooperator/objectType/CooperatorInvitation'
import { CooperatorInvitationStatus } from '../../Cooperator/objectType/CooperatorInvitationStatus'
import { CooperatorInvitationService } from '../../Cooperator/service/CooperatorInvitationService'
import { Context } from '../../shared/interface/Context'
import { ErrorWithStatus } from '../../shared/interface/ErrorWithStatus'
import { NotificationType } from '../../shared/interface/NotificationType'
import { CooperatorInvitationMapper } from '../../shared/mappers/CooperatorInvitationMapper'
import { RegistrationSelectRole } from '../../shared/objectType/RegistrationSelectRole'
import { MerchantAccessService } from '../../shared/service/MerchantAccessService'
import { sendNotificationForUser } from '../../shared/service/notifications'
import { Role } from '../../User/objectType/Role'
import { CompanyInput } from '../DTO/CompanyInput'
import { CompanyUpdateInput } from '../DTO/CompanyUpdateInput'
import { CreateCooperatorInvitationInput } from '../DTO/CreateCooperatorInvitationInput'
import { CooperatorToCompanyInput } from '../DTO/CooperatorToCompanyInput'
import { UpdateCooperatorAccessInput } from '../DTO/UpdateCooperatorAccessInput'
import { Company } from '../objectType/Comapny'
import { CompanyOwner } from '../objectType/CompanyOwner'
import { CooperatorCompany } from '../objectType/CooperatorCompany'

@ObjectType()
class TaxIdChangeRequestResponse {
  @Field()
  success: boolean
}

@Resolver(Company)
export class CompanyOwnerResolver {
  private static resolveStoreIds(
    scopeMode: 'FULL_MERCHANT' | 'STORE_SCOPED',
    storeScopeAll: boolean,
    storeAccesses: { merchantStoreId: string }[]
  ): string[] {
    if (scopeMode === 'FULL_MERCHANT' || storeScopeAll) {
      return []
    }
    return storeAccesses.map((item) => item.merchantStoreId)
  }

  @Authorized([Role.NEW_USER, Role.CLIENT])
  @Mutation(() => RegistrationSelectRole)
  async createCompanyAndMakeUserOwner(@Arg('data') companyData: CompanyInput, @Ctx() ctx: Context) {
    // Sprawdź czy użytkownik już ma company
    const existingCompany = await ctx.prisma.company.findUnique({
      where: { userId: ctx.req.user!.id },
    })

    if (existingCompany) {
      throw new ErrorWithStatus(409, 'User already has a company')
    }

    if (!companyData.taxId) {
      throw new ErrorWithStatus(400, 'Tax ID (NIP) is required')
    }

    const {
      name,
      description,
      taxId,
      address,
      city,
      postalCode,
      country,
      phone,
      email,
      website,
      facebook,
      instagram,
      tiktok,
    } = companyData
    const company = await ctx.prisma.company.create({
      data: {
        name,
        description,
        taxId,
        address,
        city,
        postalCode,
        country,
        phone,
        email,
        website,
        facebook,
        instagram,
        tiktok,
        cityOperate: {
          set: companyData.cityOperate,
        },
        logo: companyData.logoId ? { connect: { id: companyData.logoId } } : undefined,
        user: { connect: { id: ctx.req.user!.id } },
      },
    })

    const currentUser = await ctx.prisma.user.findUnique({
      where: { id: ctx.req.user?.id },
      select: { roles: true },
    })

    // Replace NEW_USER with OWNER, keep other roles
    const newRoles = currentUser?.roles.filter((role) => role !== Role.NEW_USER).concat(Role.OWNER) || [Role.OWNER]

    const user = await ctx.prisma.user.update({
      data: {
        roles: newRoles,
      },
      where: {
        id: ctx.req.user?.id,
      },
    })

    await ctx.prisma.companyOwner.create({
      data: {
        company: { connect: { id: company.id } },
        user: { connect: { id: ctx.req.user?.id } },
      },
    })

    // Award referral points for company creation (merchant completion)
    const { ReferralService } = await import('../../Referral/service/ReferralService')
    await ReferralService.awardReferralPoints(ctx.req.user!.id, 'COMPANY_CREATED')

    // Auto-clear COMPANY draft after successful creation
    await ctx.prisma.formDraft.deleteMany({
      where: {
        userId: ctx.req.user?.id,
        formType: 'COMPANY',
      },
    })

    const token = generateJWT(user)
    return { token, role: Role.OWNER }
  }

  @Authorized([Role.OWNER])
  @Mutation(() => Company)
  async updateCompany(@Arg('data') companyData: CompanyUpdateInput, @Ctx() ctx: Context) {
    const companyUpdate: PrismaDTO.CompanyUpdateInput = Object.entries(companyData).reduce((acc, [key, value]) => {
      if (key === 'cityOperate') {
        return {
          ...acc,
          cityOperate: {
            set: companyData.cityOperate,
          },
          logo: companyData.logoId ? { connect: { id: companyData.logoId } } : undefined,
        }
      }
      if (key === 'logoId') {
        return {
          ...acc,
          logo: companyData.logoId ? { connect: { id: companyData.logoId } } : undefined,
        }
      }
      return { ...acc, [key]: value }
    }, {})

    return ctx.prisma.company.update({
      data: companyUpdate,
      where: {
        userId: ctx.req.user?.id,
      },
    })
  }

  @Authorized([Role.OWNER])
  @Query(() => Company)
  async getMyCompany(@Ctx() ctx: Context) {
    const companyInclude: PrismaDTO.CompanyInclude = {
      logo: true,
      companyOwner: { include: { user: true } },
      subscription: { include: { plan: true } },
    }
    return ctx.prisma.company.findFirst({
      where: {
        userId: ctx.req.user?.id,
      },
      include: companyInclude,
    })
  }

  @Authorized([Role.OWNER, Role.COOPERATOR])
  @Query(() => [Company])
  async myAccessibleCompanies(@Ctx() ctx: Context) {
    const user = ctx.req.user
    if (!user?.id) {
      throw new ErrorWithStatus(401, 'You are not logged in')
    }

    const companyInclude: PrismaDTO.CompanyInclude = {
      logo: true,
      companyOwner: { include: { user: true } },
      subscription: { include: { plan: true } },
    }

    if (user.roles.includes(Role.OWNER)) {
      const ownerCompany = await ctx.prisma.company.findFirst({
        where: { userId: user.id },
        include: companyInclude,
      })
      return ownerCompany ? [ownerCompany] : []
    }

    if (!user.roles.includes(Role.COOPERATOR)) {
      return []
    }

    const memberships = await ctx.prisma.cooperatorCompany.findMany({
      where: {
        cooperator: { userId: user.id },
        deletedAt: null,
      },
      include: {
        companyOwner: {
          include: {
            company: {
              include: companyInclude,
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const uniqueCompanyIds = new Set<string>()
    const companies = []
    for (const membership of memberships) {
      const company = membership.companyOwner?.company
      if (company && !uniqueCompanyIds.has(company.id)) {
        uniqueCompanyIds.add(company.id)
        companies.push(company)
      }
    }

    return companies
  }

  @Authorized([Role.OWNER])
  @Mutation(() => Cooperator)
  async addCooperatorToCompany(@Arg('data') data: CooperatorToCompanyInput, @Ctx() ctx: Context) {
    const cooperator = await ctx.prisma.cooperator.findFirst({
      where: { id: data.cooperatorId },
      include: { user: true },
    })
    if (cooperator == null) {
      throw new ErrorWithStatus(404, `cooperator not found with data: ${data.cooperatorId} userId: ${ctx.req.user?.id}`)
    }

    const companyOwner = await ctx.prisma.companyOwner.findFirst({
      where: { userId: ctx.req.user?.id },
      include: { company: true, user: true },
    })

    if (companyOwner == null) {
      throw new ErrorWithStatus(404, `companyOwner not found with userId: ${ctx.req.user?.id}`)
    }

    const company = await ctx.prisma.company.findFirst({
      where: { userId: ctx.req.user?.id },
      include: {
        subscription: { include: { plan: true } },
        cooperators: true,
      },
    })

    if (!company?.subscription) {
      throw new ErrorWithStatus(402, `You need to have subscription to add cooperators`)
    }

    const { plan } = company.subscription

    if (company.cooperators.length >= plan.amountMembers) {
      throw new ErrorWithStatus(409, `You have reached maximum number of cooperators`)
    }

    await ctx.prisma.cooperatorCompany.upsert({
      where: {
        CollabToCompany: {
          cooperatorId: data.cooperatorId,
          companyOwnerId: companyOwner.id,
        },
      },
      create: {
        displayName: data.name,
        companyOwner: { connect: { id: companyOwner.id } },
        cooperator: { connect: { id: data.cooperatorId } },
      },
      update: {
        displayName: data.name,
        deletedAt: null,
      },
    })

    sendNotificationForUser(cooperator.user.id, ctx.req.user?.id, {
      title: i18next.t('notification.cooperatorAddedToCompany.title', { lng: cooperator.user.language }),
      body: i18next.t('notification.cooperatorAddedToCompany.body', {
        companyName: companyOwner.company.name,
        companyOwnerName: companyOwner.user.name || 'Owner',
        lng: cooperator.user.language,
      }),
      additionalParams: {
        type: NotificationType.ADD_COOPERATOR_TO_COMPANY,
        companyId: companyOwner.company.id,
      },
    })
    return cooperator
  }

  @Authorized([Role.OWNER])
  @Mutation(() => Cooperator)
  async deleteCooperatorFromCompany(@Arg('cooperatorId') cooperatorId: string, @Ctx() ctx: Context) {
    const cooperator = await ctx.prisma.cooperator.findFirst({
      where: { id: cooperatorId },
      include: { user: true },
    })
    if (cooperator == null) {
      throw new ErrorWithStatus(
        404,
        `deleteCooperatorFromCompany cooperator not found with data: ${cooperatorId} userId: ${ctx.req.user?.id}`
      )
    }

    const companyOwner = await ctx.prisma.companyOwner.findFirst({
      where: { userId: ctx.req.user?.id },
      include: { company: true, user: true },
    })
    if (companyOwner == null) {
      throw new ErrorWithStatus(
        404,
        `deleteCooperatorFromCompany companyOwner not found with userId: ${ctx.req.user?.id}`
      )
    }

    const cooperatorCompany = await ctx.prisma.cooperatorCompany.findMany({
      where: {
        companyOwnerId: companyOwner.id,
        cooperatorId,
        deletedAt: null,
      },
    })

    if (cooperatorCompany.length !== 1) {
      throw new ErrorWithStatus(
        404,
        `deleteCooperatorFromCompany cooperator not found, length: ${cooperatorCompany.length}`
      )
    }

    await ctx.prisma.cooperatorCompany.update({
      where: {
        id: cooperatorCompany[0].id,
      },
      data: {
        deletedAt: new Date(),
      },
    })

    // todo: anonymized files

    sendNotificationForUser(cooperator.user.id, ctx.req.user?.id, {
      title: i18next.t('notification.deleteCooperatorFromCompany.title', { lng: cooperator.user.language }),
      body: i18next.t('notification.deleteCooperatorFromCompany.body', {
        companyName: companyOwner.company.name,
        companyOwnerName: companyOwner.user.name || 'Owner',
        lng: cooperator.user.language,
      }),
      additionalParams: {
        type: NotificationType.DELETE_COOPERATOR_FROM_COMPANY,
        companyId: companyOwner.companyId,
      },
    })
    return cooperator
  }

  @Authorized([Role.OWNER])
  @Query(() => [CooperatorCompany])
  async myCooperators(@Ctx() ctx: Context) {
    const companyOwner = await ctx.prisma.companyOwner.findFirst({
      where: {
        userId: ctx.req.user?.id,
      },
    })

    const memberships = await ctx.prisma.cooperatorCompany.findMany({
      where: {
        companyOwnerId: companyOwner?.id,
        deletedAt: null,
      },
      include: {
        cooperator: { include: { user: true } },
        storeAccesses: true,
      },
    })

    return memberships.map((membership) => ({
      ...membership,
      storeIds: CompanyOwnerResolver.resolveStoreIds(
        membership.scopeMode,
        membership.storeScopeAll,
        membership.storeAccesses
      ),
    }))
  }

  @Authorized([Role.OWNER])
  @Mutation(() => CooperatorCompany)
  async updateCooperatorAccess(@Arg('data') data: UpdateCooperatorAccessInput, @Ctx() ctx: Context) {
    const companyOwner = await ctx.prisma.companyOwner.findFirst({
      where: { userId: ctx.req.user?.id },
      include: {
        company: {
          include: {
            merchant: true,
          },
        },
      },
    })

    if (!companyOwner?.company?.merchant?.id) {
      throw new ErrorWithStatus(404, 'Company owner merchant not found')
    }

    const membership = await ctx.prisma.cooperatorCompany.findFirst({
      where: {
        companyOwnerId: companyOwner.id,
        cooperatorId: data.cooperatorId,
        deletedAt: null,
      },
      include: {
        cooperator: { include: { user: true } },
      },
    })

    if (!membership) {
      throw new ErrorWithStatus(404, 'Cooperator membership not found')
    }

    const scopeMode = data.scopeMode
    const permissions = MerchantAccessService.normalizePermissions(data.permissions)
    if (permissions.length < 1) {
      throw new ErrorWithStatus(400, 'At least one permission must be selected')
    }
    const storeScopeAll = scopeMode === 'FULL_MERCHANT' ? true : data.storeScopeAll
    const storeIds = scopeMode === 'STORE_SCOPED' && !storeScopeAll ? [...new Set(data.storeIds || [])] : []
    if (!storeScopeAll) {
      if (storeIds.length < 1) {
        throw new ErrorWithStatus(400, 'At least one store must be provided for scoped access')
      }
      const validStores = await ctx.prisma.merchantStore.count({
        where: {
          merchantId: companyOwner.company.merchant.id,
          id: { in: storeIds },
        },
      })
      if (validStores !== storeIds.length) {
        throw new ErrorWithStatus(400, 'Invalid store scope for selected merchant')
      }
    }

    const updated = await ctx.prisma.cooperatorCompany.update({
      where: { id: membership.id },
      data: {
        scopeMode,
        permissions,
        storeScopeAll,
      },
    })

    await ctx.prisma.cooperatorCompanyStoreAccess.deleteMany({
      where: { cooperatorCompanyId: membership.id },
    })

    if (!storeScopeAll && storeIds.length > 0) {
      await ctx.prisma.cooperatorCompanyStoreAccess.createMany({
        data: storeIds.map((storeId) => ({
          cooperatorCompanyId: membership.id,
          merchantStoreId: storeId,
        })),
        skipDuplicates: true,
      })
    }

    return {
      ...updated,
      cooperator: membership.cooperator,
      companyOwner,
      storeIds,
    }
  }

  @Authorized([Role.OWNER])
  @Mutation(() => CooperatorInvitationCreateResult)
  async createCooperatorInvitation(@Arg('data') data: CreateCooperatorInvitationInput, @Ctx() ctx: Context) {
    const invitationService = new CooperatorInvitationService(ctx.prisma)
    const invitationResult = await invitationService.createInvitation({
      ownerUserId: ctx.req.user!.id,
      email: data.email,
      scopeMode: data.scopeMode,
      permissions: data.permissions,
      storeScopeAll: data.storeScopeAll,
      storeIds: data.storeIds,
      expiresInHours: data.expiresInHours,
    })

    return {
      invitation: CooperatorInvitationMapper.toGraphQL(
        CooperatorInvitationService.toGraphQLInvitation(invitationResult.invitation)
      ),
      webUrl: invitationResult.webUrl,
      deeplinkUrl: invitationResult.deeplinkUrl,
    }
  }

  @Authorized([Role.OWNER])
  @Mutation(() => CooperatorInvitation)
  async revokeCooperatorInvitation(@Arg('invitationId') invitationId: string, @Ctx() ctx: Context) {
    const invitationService = new CooperatorInvitationService(ctx.prisma)
    const invitation = await invitationService.revokeInvitation(ctx.req.user!.id, invitationId)
    const storeAccesses = await ctx.prisma.cooperatorInvitationStoreAccess.findMany({
      where: { invitationId: invitation.id },
    })
    return CooperatorInvitationMapper.toGraphQL(
      CooperatorInvitationService.toGraphQLInvitation({
        ...invitation,
        storeAccesses,
      })
    )
  }

  @Authorized([Role.OWNER])
  @Query(() => [CooperatorInvitation])
  async myCooperatorInvitations(
    @Arg('status', () => CooperatorInvitationStatus, { nullable: true }) status: CooperatorInvitationStatus | undefined,
    @Ctx() ctx: Context
  ) {
    const invitationService = new CooperatorInvitationService(ctx.prisma)
    const invitations = await invitationService.listOwnerInvitations(ctx.req.user!.id, status)
    return CooperatorInvitationMapper.toGraphQLArray(CooperatorInvitationService.toGraphQLInvitations(invitations))
  }

  @Authorized([Role.OWNER])
  @Mutation(() => TaxIdChangeRequestResponse)
  async requestTaxIdChange(@Ctx() ctx: Context): Promise<TaxIdChangeRequestResponse> {
    const userId = ctx.req.user!.id

    const user = await ctx.prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true },
    })

    const company = await ctx.prisma.company.findUnique({
      where: { userId },
      select: { id: true, name: true, taxId: true, address: true, city: true, postalCode: true, country: true },
    })

    if (!company) {
      throw new ErrorWithStatus(404, 'Company not found for this user')
    }

    const adminEmail = process.env.ADMIN_EMAIL || process.env.FEEDBACK_TO
    if (!adminEmail) {
      console.warn('ADMIN_EMAIL / FEEDBACK_TO not configured - tax ID change request not sent via email')
      return { success: true }
    }

    const htmlBody = `
      <h2>Prośba o zmianę NIP / Tax ID change request</h2>
      <p><strong>Użytkownik / User:</strong> ${user?.name || '—'} (${user?.email || '—'})</p>
      <p><strong>Firma / Company:</strong> ${company.name}</p>
      <p><strong>Obecny NIP / Current Tax ID:</strong> ${company.taxId}</p>
      <p><strong>Adres / Address:</strong> ${company.address}, ${company.postalCode} ${company.city}, ${
      company.country
    }</p>
      <p><strong>ID firmy / Company ID:</strong> ${company.id}</p>
      <hr/>
      <p>Użytkownik prosi o zmianę NIP. Skontaktuj się z nim, aby zweryfikować i dokonać zmiany.</p>
    `

    try {
      sgMail.setApiKey(process.env.SENDGRID_API_KEY!)
      await sgMail.send({
        to: adminEmail,
        from: process.env.SENDGRID_FROM!,
        subject: `[EasyBons] Prośba o zmianę NIP — ${company.name}`,
        html: htmlBody,
      })
    } catch (error) {
      console.error('Failed to send tax ID change request email:', error)
      throw new ErrorWithStatus(500, 'Failed to send tax ID change request')
    }

    return { success: true }
  }

  @Authorized([Role.OWNER])
  @Query(() => CompanyOwner)
  async getCompanyOwnerById(@Arg('id') companyOwnerId: string, @Ctx() ctx: Context) {
    const companyOwner = await ctx.prisma.companyOwner.findFirst({
      where: {
        id: companyOwnerId,
      },
      include: {
        user: true,
        company: true,
      },
    })
    if (companyOwner == null) {
      throw new ErrorWithStatus(404, `companyOwner not found with id: ${companyOwnerId}`)
    }
    return companyOwner
  }
}
