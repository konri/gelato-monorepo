import { Router, Request, Response, NextFunction } from 'express'
import { AuthGuard } from '../../Auth/AuthGuard'
import { Role } from '../../User/objectType/Role'
import { OrderService } from '../service/OrderService'
import { OrderRepository } from '../repository/OrderRepository'
import { MerchantAccessService } from '../../shared/service/MerchantAccessService'
import { SseRegistry } from '../sse/SseRegistry'
import { ErrorWithStatus } from '../../shared/interface/ErrorWithStatus'
import prisma from '../../shared/prisma'
import {
  deleteWebOrderSessionWebPushSubscription,
  parsePushSubscriptionBody,
  upsertWebOrderSessionWebPushSubscription,
} from '../webPush/venueOrderWebPushService'

const router = Router()

const SSE_HEARTBEAT_MS = parseInt(process.env.SSE_HEARTBEAT_MS ?? '15000')

function getService() {
  return new OrderService(prisma)
}

function setSseHeaders(res: Response): void {
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.flushHeaders()
}

// ── POST /orders/venue/:storeId/session ───────────────────────────────────────
router.post('/venue/:storeId/session', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await getService().createWebOrderSession(req.params.storeId)
    res.json(result)
  } catch (err) {
    next(err)
  }
})

// ── GET /orders/session/:sessionToken (polling) ───────────────────────────────
router.get('/session/:sessionToken', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const repo = new OrderRepository(prisma)
    const session = await repo.findWebOrderSession(req.params.sessionToken)
    if (!session || session.expiresAt < new Date()) {
      return res.status(404).json({ error: 'Session not found or expired' })
    }
    const order = await repo.findOrderBySessionToken(req.params.sessionToken)
    if (!order) {
      return res.json({ status: 'PENDING' })
    }
    res.json({ status: order.status, orderNumber: order.orderNumber })
  } catch (err) {
    next(err)
  }
})

router.post('/session/:sessionToken/web-push', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = parsePushSubscriptionBody(req.body)
    if (!parsed) {
      return res.status(400).json({ error: 'Invalid push subscription body' })
    }
    await upsertWebOrderSessionWebPushSubscription(req.params.sessionToken, parsed)
    res.json({ ok: true })
  } catch (err) {
    next(err)
  }
})

router.delete('/session/:sessionToken/web-push', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await deleteWebOrderSessionWebPushSubscription(req.params.sessionToken)
    res.json({ ok: true })
  } catch (err) {
    next(err)
  }
})

// ── GET /orders/session/:sessionToken/status-stream (SSE) ────────────────────
router.get('/session/:sessionToken/status-stream', async (req: Request, res: Response) => {
  const { sessionToken } = req.params
  const repo = new OrderRepository(prisma)

  const session = await repo.findWebOrderSession(sessionToken)
  if (!session || session.expiresAt < new Date()) {
    res.status(404).json({ error: 'Session not found or expired' })
    return
  }

  setSseHeaders(res)
  SseRegistry.addSessionConnection(sessionToken, res)

  const heartbeat = setInterval(() => {
    try {
      res.write(': heartbeat\n\n')
    } catch {
      clearInterval(heartbeat)
    }
  }, SSE_HEARTBEAT_MS)

  req.on('close', () => {
    clearInterval(heartbeat)
    SseRegistry.removeSessionConnection(sessionToken, res)
  })
})

// ── GET /orders/queue/:storeId (snapshot) ────────────────────────────────────
router.get('/queue/:storeId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const repo = new OrderRepository(prisma)
    const exists = await repo.verifyStoreExists(req.params.storeId)
    if (!exists) return res.status(404).json({ error: 'Store not found' })

    const payload = await getService().buildQueuePayload(req.params.storeId)
    res.json(payload)
  } catch (err) {
    next(err)
  }
})

// ── GET /orders/queue/:storeId/stream (SSE) ───────────────────────────────────
router.get('/queue/:storeId/stream', async (req: Request, res: Response) => {
  const { storeId } = req.params
  const repo = new OrderRepository(prisma)

  const exists = await repo.verifyStoreExists(storeId)
  if (!exists) {
    res.status(404).json({ error: 'Store not found' })
    return
  }

  setSseHeaders(res)
  SseRegistry.addQueueConnection(storeId, res)

  // Send initial snapshot immediately
  try {
    const payload = await getService().buildQueuePayload(storeId)
    res.write(`event: queue\ndata: ${JSON.stringify(payload)}\n\n`)
  } catch {
    // non-fatal — client will receive updates via pub/sub
  }

  const heartbeat = setInterval(() => {
    try {
      res.write(': heartbeat\n\n')
    } catch {
      clearInterval(heartbeat)
    }
  }, SSE_HEARTBEAT_MS)

  req.on('close', () => {
    clearInterval(heartbeat)
    SseRegistry.removeQueueConnection(storeId, res)
  })
})

// ── GET /orders/:storeId/next (vendor convenience) ───────────────────────────
router.get(
  '/:storeId/next',
  AuthGuard([Role.OWNER, Role.COOPERATOR, Role.ADMIN]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user
      const merchantAccess = new MerchantAccessService(prisma)
      const store = await prisma.merchantStore.findUnique({
        where: { id: req.params.storeId },
        select: { merchantId: true },
      })
      if (!store) return res.status(404).json({ error: 'Store not found' })

      const hasAccess = await merchantAccess.ensureMerchantAccess(user.id, user.roles, store.merchantId)
      if (!hasAccess) return res.status(403).json({ error: 'Access denied' })

      const repo = new OrderRepository(prisma)
      const order = await repo.findNextOrder(req.params.storeId)
      if (!order) return res.status(204).send()

      res.json(order)
    } catch (err) {
      next(err)
    }
  }
)

// ── GET /orders/my-order/stream (CLIENT SSE) ──────────────────────────────────────────
router.get('/my-order/stream', AuthGuard([Role.CLIENT]), async (req: Request, res: Response) => {
  const user = (req as any).user
  if (!user) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  setSseHeaders(res)
  SseRegistry.addUserConnection(user.id, res)

  // Send initial orders state (array of all active orders)
  try {
    const orders = await prisma.order.findMany({
      where: {
        userId: user.id,
        status: { in: ['PREPARING', 'DELAYED', 'READY'] },
      },
      orderBy: { createdAt: 'desc' },
      include: { merchantStore: true },
    })

    if (orders.length > 0) {
      res.write(
        `event: order-update\ndata: ${JSON.stringify(
          orders.map((order) => ({
            orderNumber: order.orderNumber,
            status: order.status,
            pickupCode: order.pickupCode,
            readyAt: order.readyAt,
            merchantStoreId: order.merchantStoreId,
            store: {
              name: order.merchantStore.name,
              address: order.merchantStore.address,
            },
          }))
        )}\n\n`
      )
    } else {
      res.write(`event: no-order\ndata: []\n\n`)
    }
  } catch {
    // non-fatal
  }

  const heartbeat = setInterval(() => {
    try {
      res.write(': heartbeat\n\n')
    } catch {
      clearInterval(heartbeat)
    }
  }, SSE_HEARTBEAT_MS)

  req.on('close', () => {
    clearInterval(heartbeat)
    SseRegistry.removeUserConnection(user.id, res)
  })
})

export default router
