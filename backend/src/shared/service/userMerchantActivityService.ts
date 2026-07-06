import { Prisma, PrismaClient } from '@prisma/client'

type Db = PrismaClient | Prisma.TransactionClient

export async function touchUserMerchantActivity(
  db: Db,
  params: { userId: string; merchantId: string; at?: Date }
): Promise<void> {
  const at = params.at ?? new Date()
  await db.userMerchantActivitySnapshot.upsert({
    where: {
      userId_merchantId: { userId: params.userId, merchantId: params.merchantId },
    },
    create: {
      userId: params.userId,
      merchantId: params.merchantId,
      firstActiveAt: at,
      lastActiveAt: at,
    },
    update: { lastActiveAt: at },
  })
}
