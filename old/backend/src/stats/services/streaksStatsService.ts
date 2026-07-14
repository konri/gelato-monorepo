import { PrismaClient } from '@prisma/client'
import { StatsContext } from '../utils/statsContext'
import { merchantStoreIdScopeWhere } from '../utils/queryHelpers'

export type StreakProgramRow = {
  streakProgramId: string
  name: string
  visitsInPeriod: number
  distinctUsersInPeriod: number
  rewardClaimsInPeriod: number
}

export type StreaksStatsPayload = {
  period: { from: string; to: string }
  merchantId: string
  storeScopeApplied: boolean
  activeStreakPrograms: number
  totalVisitsInPeriod: number
  distinctUsersWithVisitInPeriod: number
  totalRewardClaimsInPeriod: number
  averageCurrentStreak: number
  averageLongestStreak: number
  programBreakdown: StreakProgramRow[]
}

export async function computeStreaksStats(prisma: PrismaClient, ctx: StatsContext): Promise<StreaksStatsPayload> {
  const { merchantId, from, to, storeIds, streakProgramId } = ctx

  const progWhere = {
    merchantId,
    deletedAt: null,
    ...(streakProgramId ? { id: streakProgramId } : {}),
  } as const

  const visitWhere = {
    merchantId,
    createdAt: { gte: from, lte: to },
    ...merchantStoreIdScopeWhere(storeIds),
    ...(streakProgramId ? { streakProgramId } : {}),
  }

  const rewardClaimWhere = {
    merchantId,
    claimedAt: { gte: from, lte: to },
    ...(streakProgramId ? { streakProgramId } : {}),
  }

  const [
    activePrograms,
    totalVisitsInPeriod,
    distinctUserBuckets,
    totalRewardClaimsInPeriod,
    streakAvg,
    programs,
  ] = await Promise.all([
    prisma.streakProgram.count({
      where: { ...progWhere, isActive: true },
    }),
    prisma.streakVisit.count({ where: visitWhere }),
    prisma.streakVisit.groupBy({
      by: ['userId'],
      where: visitWhere,
      _count: { _all: true },
    }),
    prisma.streakRewardClaim.count({ where: rewardClaimWhere }),
    prisma.userStreakState.aggregate({
      where: { merchantId, ...(streakProgramId ? { streakProgramId } : {}) },
      _avg: { currentStreak: true, longestStreak: true },
    }),
    prisma.streakProgram.findMany({
      where: progWhere,
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    }),
  ])

  const programRows = await Promise.all(
    programs.map(async (sp) => {
      const vw = {
        streakProgramId: sp.id,
        createdAt: { gte: from, lte: to },
        ...merchantStoreIdScopeWhere(storeIds),
      }
      const [visits, distinctBuckets, claims] = await Promise.all([
        prisma.streakVisit.count({ where: vw }),
        prisma.streakVisit.groupBy({
          by: ['userId'],
          where: vw,
          _count: { _all: true },
        }),
        prisma.streakRewardClaim.count({
          where: {
            streakProgramId: sp.id,
            claimedAt: { gte: from, lte: to },
          },
        }),
      ])
      return {
        streakProgramId: sp.id,
        name: sp.name,
        visitsInPeriod: visits,
        distinctUsersInPeriod: distinctBuckets.length,
        rewardClaimsInPeriod: claims,
      }
    })
  )

  return {
    period: { from: from.toISOString(), to: to.toISOString() },
    merchantId,
    storeScopeApplied: storeIds !== null,
    activeStreakPrograms: activePrograms,
    totalVisitsInPeriod,
    distinctUsersWithVisitInPeriod: distinctUserBuckets.length,
    totalRewardClaimsInPeriod,
    averageCurrentStreak: Math.round((streakAvg._avg.currentStreak ?? 0) * 100) / 100,
    averageLongestStreak: Math.round((streakAvg._avg.longestStreak ?? 0) * 100) / 100,
    programBreakdown: programRows,
  }
}
