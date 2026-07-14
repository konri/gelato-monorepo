import { PrismaClient } from '@prisma/client'
import { StatsContext } from '../utils/statsContext'
import { startOfTrendBucketUtc } from '../utils/trendBucketUtc'
import { TrendGranularity } from '../utils/trendGranularity'

export type OrdersTrendStatsPayload = {
  period: { from: string; to: string }
  merchantId: string
  storeScopeApplied: boolean
  granularity: TrendGranularity
  series: { periodStart: string; ordersCreated: number }[]
}

export type StreakVisitsTrendStatsPayload = {
  period: { from: string; to: string }
  merchantId: string
  storeScopeApplied: boolean
  granularity: TrendGranularity
  series: { periodStart: string; streakVisits: number }[]
}

function addToBucketMap(map: Map<string, number>, at: Date, granularity: TrendGranularity, delta: number): void {
  const b = startOfTrendBucketUtc(at, granularity)
  const k = b.toISOString()
  map.set(k, (map.get(k) ?? 0) + delta)
}

function sortedSeriesFromMap(map: Map<string, number>): { periodStart: string; value: number }[] {
  return [...map.keys()].sort().map((periodStart) => ({ periodStart, value: map.get(periodStart) ?? 0 }))
}

async function resolveOrderStoreIds(
  prisma: PrismaClient,
  merchantId: string,
  storeIds: string[] | null
): Promise<string[]> {
  if (storeIds === null) {
    return (await prisma.merchantStore.findMany({ where: { merchantId }, select: { id: true } })).map((x) => x.id)
  }
  return storeIds
}

export async function computeOrdersTrendStats(
  prisma: PrismaClient,
  ctx: StatsContext,
  granularity: TrendGranularity
): Promise<OrdersTrendStatsPayload> {
  const { merchantId, from, to, storeIds } = ctx
  const dateInRange = { gte: from, lte: to }
  const orderStoreIds = await resolveOrderStoreIds(prisma, merchantId, storeIds)

  const orderRows =
    orderStoreIds.length === 0
      ? []
      : await prisma.order.findMany({
          where: {
            createdAt: dateInRange,
            merchantStoreId: { in: orderStoreIds },
          },
          select: { createdAt: true },
        })

  const ordersCreated = new Map<string, number>()
  for (const r of orderRows) {
    addToBucketMap(ordersCreated, r.createdAt, granularity, 1)
  }

  const series = sortedSeriesFromMap(ordersCreated).map(({ periodStart, value }) => ({
    periodStart,
    ordersCreated: value,
  }))

  return {
    period: { from: from.toISOString(), to: to.toISOString() },
    merchantId,
    storeScopeApplied: storeIds !== null,
    granularity,
    series,
  }
}

export async function computeStreakVisitsTrendStats(
  prisma: PrismaClient,
  ctx: StatsContext,
  granularity: TrendGranularity
): Promise<StreakVisitsTrendStatsPayload> {
  const { merchantId, from, to, storeIds, streakProgramId } = ctx
  const dateInRange = { gte: from, lte: to }

  const streakRows = await prisma.streakVisit.findMany({
    where: {
      merchantId,
      createdAt: dateInRange,
      ...(streakProgramId === null ? {} : { streakProgramId }),
      ...(storeIds === null ? {} : { merchantStoreId: { in: storeIds } }),
    },
    select: { createdAt: true },
  })

  const streakVisits = new Map<string, number>()
  for (const r of streakRows) {
    addToBucketMap(streakVisits, r.createdAt, granularity, 1)
  }

  const series = sortedSeriesFromMap(streakVisits).map(({ periodStart, value }) => ({
    periodStart,
    streakVisits: value,
  }))

  return {
    period: { from: from.toISOString(), to: to.toISOString() },
    merchantId,
    storeScopeApplied: storeIds !== null,
    granularity,
    series,
  }
}
