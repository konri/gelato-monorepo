import { OperatorScopeMode, PrismaClient } from '@prisma/client'
import { ErrorWithStatus } from '../../shared/interface/ErrorWithStatus'
import { Role } from '../../User/objectType/Role'
import { MerchantAccessService } from '../../shared/service/MerchantAccessService'
import { parseStatsDateRange, StatsDateRange } from './statsDateRange'
import { firstString, parseStoreIdsFromQuery } from './queryHelpers'
import { UserJWT } from '../../Auth/model/UserJWT'
import { parseStatsCompareMode, resolveComparisonDateRange, StatsCompareMode } from './statsComparisonRange'

export type StatsContext = StatsDateRange & {
  merchantId: string
  storeIds: string[] | null
  loyaltyCardTemplateId: string | null
  streakProgramId: string | null
}

export type StatsRequestResolved = {
  primary: StatsContext
  comparison: StatsContext | null
  compareMode: StatsCompareMode
}

/**
 * Resolves merchant, optional store scope (cooperators), store filter list, dimension filters, and UTC date ranges.
 */
export async function buildStatsRequestContext(
  prisma: PrismaClient,
  user: UserJWT,
  query: Record<string, unknown>
): Promise<StatsRequestResolved> {
  const range = parseStatsDateRange(query)
  const compareMode = parseStatsCompareMode(firstString(query.compareMode))
  const comparisonRange = resolveComparisonDateRange(range, compareMode)

  const merchantIdParam = firstString(query.merchantId)?.trim() || undefined
  const storeIdParam = firstString(query.storeId)?.trim() || undefined
  const storeIdsFromQuery = parseStoreIdsFromQuery(query)
  const loyaltyCardTemplateId = firstString(query.loyaltyCardTemplateId)?.trim() || null
  const streakProgramId = firstString(query.streakProgramId)?.trim() || null
  const access = new MerchantAccessService(prisma)

  let merchantId: string
  let storeIds: string[] | null = null

  if (user.roles.includes(Role.ADMIN)) {
    if (!merchantIdParam) {
      throw new ErrorWithStatus(400, 'merchantId query parameter is required for admin users')
    }
    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantIdParam },
      select: { id: true },
    })
    if (!merchant) {
      throw new ErrorWithStatus(404, 'Merchant not found')
    }
    merchantId = merchantIdParam
  } else {
    const scopes = await access.resolveOperatorMerchantScopes(user.id, user.roles)
    if (scopes.length === 0) {
      throw new ErrorWithStatus(403, 'No merchant associated with this account')
    }

    let chosen = scopes[0]
    if (merchantIdParam) {
      const found = scopes.find((s) => s.merchantId === merchantIdParam)
      if (!found) {
        throw new ErrorWithStatus(403, 'You do not have access to this merchant')
      }
      chosen = found
    } else if (scopes.length > 1) {
      throw new ErrorWithStatus(400, 'merchantId query parameter is required when you manage multiple merchants')
    }

    merchantId = chosen.merchantId
    const fullMerchant = chosen.scopeMode === OperatorScopeMode.FULL_MERCHANT || chosen.storeScopeAll
    if (!fullMerchant) {
      storeIds = chosen.storeIds
      if (!storeIds.length) {
        throw new ErrorWithStatus(403, 'No store scope assigned to this operator account')
      }
    }
  }

  const requestedIds = storeIdsFromQuery ?? (storeIdParam ? [storeIdParam] : null)
  if (requestedIds?.length) {
    const stores = await prisma.merchantStore.findMany({
      where: { id: { in: requestedIds }, merchantId },
      select: { id: true },
    })
    if (stores.length !== requestedIds.length) {
      throw new ErrorWithStatus(400, 'One or more stores were not found for this merchant')
    }
    if (storeIds !== null) {
      const allowedStoreIds = storeIds
      if (requestedIds.some((id) => !allowedStoreIds.includes(id))) {
        throw new ErrorWithStatus(403, 'You do not have access to one or more requested stores')
      }
    }
    storeIds = requestedIds
  }

  if (loyaltyCardTemplateId) {
    const tpl = await prisma.loyaltyStampCardTemplate.findFirst({
      where: { id: loyaltyCardTemplateId, merchantId },
      select: { id: true },
    })
    if (!tpl) {
      throw new ErrorWithStatus(404, 'Loyalty card template not found for this merchant')
    }
  }

  if (streakProgramId) {
    const prog = await prisma.streakProgram.findFirst({
      where: { id: streakProgramId, merchantId, deletedAt: null },
      select: { id: true },
    })
    if (!prog) {
      throw new ErrorWithStatus(404, 'Streak program not found for this merchant')
    }
  }

  const base = {
    merchantId,
    storeIds,
    loyaltyCardTemplateId,
    streakProgramId,
  }

  const primary: StatsContext = { ...base, ...range }
  const comparison: StatsContext | null = comparisonRange === null ? null : { ...base, ...comparisonRange }

  return { primary, comparison, compareMode }
}
