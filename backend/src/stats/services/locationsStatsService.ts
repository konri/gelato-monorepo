import { PrismaClient } from '@prisma/client'
import { StatsContext } from '../utils/statsContext'

export type LocationMetricRow = {
  merchantStoreId: string
  storeName: string
  city: string | null
  ordersCreatedInPeriod: number
  usersWhoFavoritedStore: number
}

export type LocationsStatsPayload = {
  period: { from: string; to: string }
  merchantId: string
  storeScopeApplied: boolean
  locations: LocationMetricRow[]
}

/**
 * Pulls per-store operational counters (orders, saved favourites) for storefront benchmarking.
 */
export async function computeLocationsStats(prisma: PrismaClient, ctx: StatsContext): Promise<LocationsStatsPayload> {
  const { merchantId, from, to, storeIds } = ctx

  const stores = await prisma.merchantStore.findMany({
    where: {
      merchantId,
      ...(storeIds ? { id: { in: storeIds } } : {}),
    },
    select: { id: true, name: true, city: true },
    orderBy: { name: 'asc' },
  })

  if (!stores.length) {
    return {
      period: { from: from.toISOString(), to: to.toISOString() },
      merchantId,
      storeScopeApplied: storeIds !== null,
      locations: [],
    }
  }

  const storeIdsList = stores.map((s) => s.id)

  const [orderGroups, favoriteGroups] = await Promise.all([
    prisma.order.groupBy({
      by: ['merchantStoreId'],
      where: {
        merchantStoreId: { in: storeIdsList },
        createdAt: { gte: from, lte: to },
      },
      _count: { _all: true },
    }),
    prisma.favoriteStore.groupBy({
      by: ['merchantStoreId'],
      where: { merchantStoreId: { in: storeIdsList } },
      _count: { _all: true },
    }),
  ])

  const orderMap = new Map(orderGroups.map((r) => [r.merchantStoreId, r._count._all]))
  const favoriteMap = new Map(favoriteGroups.map((r) => [r.merchantStoreId, r._count._all]))

  const locations: LocationMetricRow[] = stores.map((store) => ({
    merchantStoreId: store.id,
    storeName: store.name,
    city: store.city,
    ordersCreatedInPeriod: orderMap.get(store.id) ?? 0,
    usersWhoFavoritedStore: favoriteMap.get(store.id) ?? 0,
  }))

  return {
    period: { from: from.toISOString(), to: to.toISOString() },
    merchantId,
    storeScopeApplied: storeIds !== null,
    locations,
  }
}
