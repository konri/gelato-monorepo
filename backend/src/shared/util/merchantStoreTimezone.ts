import type { PrismaClient } from '@prisma/client'

const DEFAULT_MERCHANT_STORE_TIMEZONE = 'UTC'

export async function getMerchantStoreTimezone(prisma: PrismaClient, merchantStoreId: string): Promise<string> {
  const store = await prisma.merchantStore.findUnique({
    where: { id: merchantStoreId },
    select: { id: true },
  })
  if (!store) {
    return DEFAULT_MERCHANT_STORE_TIMEZONE
  }
  return DEFAULT_MERCHANT_STORE_TIMEZONE
}
