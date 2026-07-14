import type { MerchantStoreOrderQueueConfig as PrismaMerchantStoreOrderQueueConfig } from '@prisma/client'
import { MerchantStore } from '../../Merchant/objectType/MerchantStore'
import { MerchantStoreOrderQueueConfig } from '../../Order/objectType/MerchantStoreOrderQueueConfig'

function mapOrderQueueSettings(
  row: PrismaMerchantStoreOrderQueueConfig | null | undefined
): MerchantStoreOrderQueueConfig | null {
  if (!row) return null
  return {
    orderArchiveDelayMs: row.orderArchiveDelayMs,
    maxActiveOrders: row.maxActiveOrders,
    webSessionTtlMs: row.webSessionTtlMs,
    orderReadyPushTitle: row.orderReadyPushTitle,
    orderReadyPushBody: row.orderReadyPushBody,
    orderNumberRolloverAfter: row.orderNumberRolloverAfter,
    autoPickUpAfterReady: row.autoPickUpAfterReady,
    orderReadyReminderEnabled: row.orderReadyReminderEnabled,
    orderReadyReminderDelayMs: row.orderReadyReminderDelayMs,
    requirePickupCode: row.requirePickupCode,
  }
}

export class MerchantStoreMapper {
  static toGraphQL(prismaStore: any): MerchantStore {
    return {
      id: prismaStore.id,
      name: prismaStore.name,
      description: prismaStore.description,
      address: prismaStore.address,
      city: prismaStore.city,
      phone: prismaStore.phone,
      postalCode: prismaStore.postalCode,
      email: prismaStore.email,
      country: prismaStore.country,
      openingHours: prismaStore.hours,
      latitude: prismaStore.latitude,
      longitude: prismaStore.longitude,
      logoUrl: prismaStore.logoUrl,
      photoUrl: prismaStore.photoUrl,
      images: prismaStore.images || [],
      category: prismaStore.category,
      isActive: prismaStore.isActive,
      merchantId: prismaStore.merchantId,
      merchant: prismaStore.merchant,
      availablePromotions: prismaStore.availablePromotions,
      distanceKm: prismaStore.distanceKm,
      stampCard: prismaStore.stampCard,
      userPoints: prismaStore.userPoints,
      promotions: prismaStore.promotions,
      orderQueueSettings: mapOrderQueueSettings(prismaStore.orderQueueConfig),
      createdAt: prismaStore.createdAt,
      updatedAt: prismaStore.updatedAt,
    } as MerchantStore
  }

  static toGraphQLArray(prismaStores: any[]): MerchantStore[] {
    return prismaStores.map((store) => this.toGraphQL(store))
  }
}
