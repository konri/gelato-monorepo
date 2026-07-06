import { Queue, Worker } from 'bullmq'
import { OrderPickUpSource, OrderStatus } from '@prisma/client'
import { redis, REDIS_ENABLED } from '../../Config/redis'
import { SseRegistry } from '../sse/SseRegistry'
import { publishQueueEvent, publishSessionEvent } from '../sse/SsePublisher'
import { computeQueuePayload } from '../service/orderQueuePayload'
import prisma from '../../shared/prisma'

if (!REDIS_ENABLED) {
  console.log('⚠️  Order jobs disabled (Redis disabled)')
}

// ── Archive Queue: READY → PICKED_UP after configurable delay ────────────────

export const orderArchiveQueue = REDIS_ENABLED
  ? new Queue('order-archive', {
      connection: redis as any,
    })
  : null

export const readyReminderJobId = (orderId: string): string => `ready-reminder-${orderId}`

// ── Ready reminder queue: ORDER_READY_REMINDER push after delay if still READY ─

export const orderReadyReminderQueue = REDIS_ENABLED
  ? new Queue('order-ready-reminder', {
      connection: redis as any,
    })
  : null

export async function cancelReadyReminderJob(orderId: string): Promise<void> {
  try {
    await orderReadyReminderQueue?.remove(readyReminderJobId(orderId))
  } catch {
    /* job missing — ok */
  }
}

const orderArchiveWorker = REDIS_ENABLED
  ? new Worker(
      'order-archive',
      async (job) => {
        const { orderId } = job.data
        const order = await prisma.order.findUnique({ where: { id: orderId } })
        if (!order) return
        if (order.status === OrderStatus.READY) {
          await cancelReadyReminderJob(orderId)
          const pickedUpAt = new Date()
          await prisma.order.update({
            where: { id: orderId },
            data: {
              status: OrderStatus.PICKED_UP,
              pickedUpSource: OrderPickUpSource.AUTO_AFTER_READY_DELAY,
              pickedUpAt,
            },
          })
          if (order.sessionToken) {
            await publishSessionEvent(order.sessionToken, {
              status: 'PICKED_UP',
              orderNumber: order.orderNumber,
              pickedUpSource: OrderPickUpSource.AUTO_AFTER_READY_DELAY,
            })
          }
          const queuePayload = await computeQueuePayload(prisma, order.merchantStoreId)
          await publishQueueEvent(order.merchantStoreId, queuePayload)
          console.log(`✅ Order ${orderId} archived as PICKED_UP (auto after ready delay)`)
        }
      },
      { connection: redis as any, stalledInterval: 30000 }
    )
  : null

if (orderArchiveWorker) {
  orderArchiveWorker.on('failed', (job, err) => {
    console.error(`❌ order-archive job ${job?.id} failed:`, err)
  })
}

const orderReadyReminderWorker = REDIS_ENABLED
  ? new Worker(
      'order-ready-reminder',
      async (job) => {
        const { orderId } = job.data as { orderId: string }
        const { OrderService } = await import('../service/OrderService')
        const svc = new OrderService(prisma)
        await svc.sendReadyReminderIfStillReady(orderId)
      },
      { connection: redis as any, stalledInterval: 30000 }
    )
  : null

if (orderReadyReminderWorker) {
  orderReadyReminderWorker.on('failed', (job, err) => {
    console.error(`❌ order-ready-reminder job ${job?.id} failed:`, err)
  })
}

// ── Session Cleanup Queue: close expired WebOrderSessions ────────────────────

export const sessionCleanupQueue = REDIS_ENABLED
  ? new Queue('session-cleanup', {
      connection: redis as any,
    })
  : null

const sessionCleanupWorker = REDIS_ENABLED
  ? new Worker(
      'session-cleanup',
      async (job) => {
        const { sessionToken } = job.data
        // Close any active SSE connections for this session
        SseRegistry.closeSessionConnections(sessionToken)
        // Delete the session record
        await prisma.webOrderSession.deleteMany({ where: { sessionToken } })
        console.log(`✅ Session ${sessionToken} cleaned up`)
      },
      { connection: redis as any, stalledInterval: 30000 }
    )
  : null

if (sessionCleanupWorker) {
  sessionCleanupWorker.on('failed', (job, err) => {
    console.error(`❌ session-cleanup job ${job?.id} failed:`, err)
  })
}
