import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import { OrderStatus, PrismaClient } from '@prisma/client'
import { getMerchantStoreTimezone } from '../../shared/util/merchantStoreTimezone'
import { OrderRepository } from '../repository/OrderRepository'

dayjs.extend(utc)
dayjs.extend(timezone)

export type QueuePayload = {
  preparing: number[]
  delayed: number[]
  ready: number[]
  lastReadyOrderNumber?: number
}

export async function computeQueuePayload(prisma: PrismaClient, merchantStoreId: string): Promise<QueuePayload> {
  const tz = await getMerchantStoreTimezone(prisma, merchantStoreId)
  const today = dayjs().tz(tz).startOf('day').toDate()
  const repo = new OrderRepository(prisma)
  const orders = await repo.findTodayOrdersByStore(merchantStoreId, today)

  const preparing = orders.filter((o) => o.status === OrderStatus.PREPARING).map((o) => o.orderNumber)
  const delayed = orders.filter((o) => o.status === OrderStatus.DELAYED).map((o) => o.orderNumber)
  const ready = orders.filter((o) => o.status === OrderStatus.READY).map((o) => o.orderNumber)
  const lastReadyOrderNumber = ready.length > 0 ? Math.max(...ready) : undefined

  return { preparing, delayed, ready, lastReadyOrderNumber }
}
