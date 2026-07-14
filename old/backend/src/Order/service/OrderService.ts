import { Prisma, PrismaClient, OrderStatus, OrderPickUpSource } from '@prisma/client'
import * as crypto from 'crypto'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import { OrderRepository } from '../repository/OrderRepository'
import { MerchantAccessService } from '../../shared/service/MerchantAccessService'
import { NotificationService } from '../../services/NotificationService'
import { OrderSmsService } from './OrderSmsService'
import { publishSessionEvent, publishQueueEvent, publishUserEvent } from '../sse/SsePublisher'
import {
  orderArchiveQueue,
  orderReadyReminderQueue,
  sessionCleanupQueue,
  cancelReadyReminderJob,
  readyReminderJobId,
} from '../jobs/orderJobs'
import { ErrorWithStatus } from '../../shared/interface/ErrorWithStatus'
import { touchUserMerchantActivity } from '../../shared/service/userMerchantActivityService'
import { getMerchantStoreTimezone } from '../../shared/util/merchantStoreTimezone'
import { computeQueuePayload, QueuePayload } from './orderQueuePayload'
import { generatePickupCode } from '../util/generatePickupCode'

dayjs.extend(utc)
dayjs.extend(timezone)

export type { QueuePayload } from './orderQueuePayload'

const ORDER_BASE_URL = process.env.ORDER_BASE_URL ?? 'http://localhost:3000'

const DEFAULT_READY_PUSH_TITLE = 'Your order is ready'
const DEFAULT_READY_PUSH_BODY = 'Order #{orderNumber} is ready for pickup'

type MerchantStoreOrderQueueSettingsPatch = {
  orderArchiveDelayMs?: number
  maxActiveOrders?: number
  webSessionTtlMs?: number
  orderReadyPushTitle?: string | null
  orderReadyPushBody?: string | null
  orderNumberRolloverAfter?: number
  autoPickUpAfterReady?: boolean
  orderReadyReminderEnabled?: boolean
  orderReadyReminderDelayMs?: number
  requirePickupCode?: boolean
}

function definedOrderQueueConfigDefinedScalars(
  patch: MerchantStoreOrderQueueSettingsPatch
): Partial<MerchantStoreOrderQueueSettingsPatch> {
  return Object.fromEntries(Object.entries(patch).filter(([, value]) => value !== undefined)) as Partial<
    MerchantStoreOrderQueueSettingsPatch
  >
}

function definedOrderQueueConfigUpdateData(
  patch: MerchantStoreOrderQueueSettingsPatch
): Prisma.MerchantStoreOrderQueueConfigUpdateInput {
  return definedOrderQueueConfigDefinedScalars(patch) as Prisma.MerchantStoreOrderQueueConfigUpdateInput
}

function merchantStoreOrderQueueConfigCreateData(
  merchantStoreId: string,
  patch: MerchantStoreOrderQueueSettingsPatch
): Prisma.MerchantStoreOrderQueueConfigUncheckedCreateInput {
  return { merchantStoreId, ...definedOrderQueueConfigDefinedScalars(patch) }
}

const MERCHANT_STORE_ORDER_QUEUE_CONFIG_SELECT = {
  orderArchiveDelayMs: true,
  maxActiveOrders: true,
  webSessionTtlMs: true,
  orderReadyPushTitle: true,
  orderReadyPushBody: true,
  orderNumberRolloverAfter: true,
  autoPickUpAfterReady: true,
  orderReadyReminderEnabled: true,
  orderReadyReminderDelayMs: true,
  requirePickupCode: true,
} as Prisma.MerchantStoreOrderQueueConfigSelect

export class OrderService {
  private repo: OrderRepository
  private merchantAccess: MerchantAccessService
  private notificationService: NotificationService

  constructor(private prisma: PrismaClient) {
    this.repo = new OrderRepository(prisma)
    this.merchantAccess = new MerchantAccessService(prisma)
    this.notificationService = NotificationService.getInstance()
  }

  private archiveJobId(orderId: string): string {
    return `archive-order-${orderId}`
  }

  private async removeArchiveJob(orderId: string): Promise<void> {
    try {
      await orderArchiveQueue?.remove(this.archiveJobId(orderId))
    } catch {
      /* job missing — ok */
    }
  }

  private async scheduleAutoPickUpAfterReady(orderId: string, merchantStoreId: string): Promise<void> {
    const cfg = await this.requireStoreQueueConfig(merchantStoreId)
    if (!cfg.autoPickUpAfterReady) return
    await orderArchiveQueue?.add(
      'archive-order',
      { orderId },
      { delay: cfg.orderArchiveDelayMs, jobId: this.archiveJobId(orderId) }
    )
  }

  private async scheduleReadyReminderAfterReady(
    orderId: string,
    merchantStoreId: string,
    userId: string | null | undefined
  ): Promise<void> {
    if (!userId) return
    const cfg = await this.requireStoreQueueConfig(merchantStoreId)
    if (!cfg.orderReadyReminderEnabled) return
    if (cfg.orderReadyReminderDelayMs < 60_000) return
    await cancelReadyReminderJob(orderId)
    await orderReadyReminderQueue?.add(
      'send-ready-reminder',
      { orderId },
      { delay: cfg.orderReadyReminderDelayMs, jobId: readyReminderJobId(orderId) }
    )
  }

  async sendReadyReminderIfStillReady(orderId: string): Promise<void> {
    const order = await this.repo.findOrderById(orderId)
    if (!order || order.status !== OrderStatus.READY || !order.userId) return
    const cfg = await this.requireStoreQueueConfig(order.merchantStoreId)
    if (!cfg.orderReadyReminderEnabled) return
    try {
      const title = this.formatReadyNotificationPart(
        cfg.orderReadyPushTitle,
        order.orderNumber,
        DEFAULT_READY_PUSH_TITLE
      )
      const message = this.formatReadyNotificationPart(
        cfg.orderReadyPushBody,
        order.orderNumber,
        DEFAULT_READY_PUSH_BODY
      )
      await this.notificationService.sendPushNotification({
        userId: order.userId,
        category: 'GENERAL',
        type: 'ORDER_READY_REMINDER',
        title,
        message,
        metadata: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          pickedUpExpectation: cfg.autoPickUpAfterReady ? 'AUTO_AFTER_DELAY_OR_MANUAL' : 'MANUAL_ONLY',
          reminder: true,
        },
        prisma: this.prisma,
      })
    } catch (err) {
      console.warn('Failed to send order ready reminder notification:', err)
    }
  }

  private async requireStoreQueueConfig(merchantStoreId: string) {
    const storeExists = await this.prisma.merchantStore.findUnique({
      where: { id: merchantStoreId },
      select: { id: true },
    })
    if (!storeExists) throw new ErrorWithStatus(404, 'Store not found')
    const cfg = await this.prisma.merchantStoreOrderQueueConfig.findUnique({
      where: { merchantStoreId },
      select: MERCHANT_STORE_ORDER_QUEUE_CONFIG_SELECT,
    })
    if (!cfg) {
      throw new ErrorWithStatus(409, 'Order queue is not configured for this store')
    }
    return cfg
  }

  private getOrderDate(tz: string): Date {
    return dayjs().tz(tz).startOf('day').toDate()
  }

  private async enforceActiveOrderLimit(merchantStoreId: string): Promise<void> {
    const cfg = await this.requireStoreQueueConfig(merchantStoreId)
    const count = await this.repo.countActiveOrders(merchantStoreId)
    if (count >= cfg.maxActiveOrders) {
      throw new ErrorWithStatus(429, 'Too many active orders')
    }
  }

  private async resolveUserIdForUserQrInput(userIdOrEmail: string): Promise<string> {
    const raw = userIdOrEmail.trim()
    if (!raw) {
      throw new ErrorWithStatus(400, 'User identifier is required')
    }
    const isEmail = raw.includes('@')
    const user = await this.prisma.user.findFirst({
      where: isEmail ? { email: raw.toLowerCase() } : { id: raw },
      select: { id: true },
    })
    if (!user) {
      throw new ErrorWithStatus(404, 'User not found')
    }
    return user.id
  }

  private async verifyVendorStoreAccess(userId: string, roles: string[], merchantStoreId: string): Promise<void> {
    const store = await this.prisma.merchantStore.findUnique({
      where: { id: merchantStoreId },
      select: { merchantId: true },
    })
    if (!store) throw new ErrorWithStatus(404, 'Store not found')

    const hasAccess = await this.merchantAccess.ensureMerchantAccess(userId, roles, store.merchantId)
    if (!hasAccess) throw new ErrorWithStatus(403, 'Access denied')
  }

  private normalizeStaffNote(raw: string | null | undefined): string | null {
    if (raw == null) return null
    const trimmed = raw.trim()
    if (!trimmed) return null
    const max = 2000
    return trimmed.length > max ? trimmed.slice(0, max) : trimmed
  }

  private formatReadyNotificationPart(
    template: string | null | undefined,
    orderNumber: number,
    fallback: string
  ): string {
    const base = template?.trim().length ? template.trim() : fallback
    return base.split('{orderNumber}').join(String(orderNumber))
  }

  private async broadcastQueue(merchantStoreId: string): Promise<void> {
    const queuePayload = await computeQueuePayload(this.prisma, merchantStoreId)
    await publishQueueEvent(merchantStoreId, queuePayload)
  }

  private async broadcastUserOrders(userId: string): Promise<void> {
    const orders = await this.prisma.order.findMany({
      where: {
        userId,
        status: { in: [OrderStatus.PREPARING, OrderStatus.DELAYED, OrderStatus.READY] },
      },
      orderBy: { createdAt: 'desc' },
      include: { merchantStore: { select: { name: true, address: true } } },
    })

    const payload = orders.map((order) => ({
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

    await publishUserEvent(userId, payload)
  }

  async createOrderByUserQR(params: {
    userId?: string | null
    merchantStoreId: string
    note?: string | null
    vendorUserId: string
    vendorRoles: string[]
  }): Promise<{ orderId: string; orderNumber: number; note: string | null }> {
    const { merchantStoreId, vendorUserId, vendorRoles } = params
    const note = this.normalizeStaffNote(params.note)

    await this.verifyVendorStoreAccess(vendorUserId, vendorRoles, merchantStoreId)

    const rawUserId = params.userId?.trim() ?? ''
    const resolvedUserId = rawUserId === '' ? null : await this.resolveUserIdForUserQrInput(rawUserId)

    await this.enforceActiveOrderLimit(merchantStoreId)

    const cfg = await this.requireStoreQueueConfig(merchantStoreId)
    const tz = await getMerchantStoreTimezone(this.prisma, merchantStoreId)
    const orderDate = this.getOrderDate(tz)
    const orderNumber = await this.repo.generateOrderNumber(merchantStoreId, orderDate, cfg.orderNumberRolloverAfter)
    const pickupCode = cfg.requirePickupCode ? generatePickupCode(orderNumber) : null

    const order = await this.repo.createOrder({
      merchantStoreId,
      orderNumber,
      orderDate,
      userId: resolvedUserId,
      sessionToken: null,
      note,
      pickupCode,
    })

    const store = await this.prisma.merchantStore.findUnique({
      where: { id: merchantStoreId },
      select: { merchantId: true },
    })
    if (store && resolvedUserId != null) {
      await touchUserMerchantActivity(this.prisma, { userId: resolvedUserId, merchantId: store.merchantId })
    }

    if (resolvedUserId) {
      await publishUserEvent(resolvedUserId, {
        orderNumber: order.orderNumber,
        status: 'PREPARING',
        pickupCode: order.pickupCode,
      })
    }

    await this.broadcastQueue(merchantStoreId)

    return { orderId: order.id, orderNumber: order.orderNumber, note: order.note }
  }

  async createOrderBySession(params: {
    sessionToken: string
    merchantStoreId: string
    note?: string | null
    vendorUserId: string
    vendorRoles: string[]
  }): Promise<{ orderId: string; orderNumber: number; note: string | null }> {
    const { sessionToken, merchantStoreId, vendorUserId, vendorRoles } = params
    const note = this.normalizeStaffNote(params.note)

    const session = await this.repo.findWebOrderSession(sessionToken)
    if (!session) throw new ErrorWithStatus(404, 'Session not found')
    if (session.expiresAt < new Date()) throw new ErrorWithStatus(410, 'Session expired')
    if (session.merchantStoreId !== merchantStoreId) {
      throw new ErrorWithStatus(403, 'Session does not belong to this store')
    }

    const existingForSession = await this.repo.findOrderBySessionToken(sessionToken)
    if (existingForSession) {
      throw new ErrorWithStatus(409, 'Order already assigned to this session')
    }

    await this.verifyVendorStoreAccess(vendorUserId, vendorRoles, merchantStoreId)
    await this.enforceActiveOrderLimit(merchantStoreId)

    const cfg = await this.requireStoreQueueConfig(merchantStoreId)
    const tz = await getMerchantStoreTimezone(this.prisma, merchantStoreId)
    const orderDate = this.getOrderDate(tz)
    const orderNumber = await this.repo.generateOrderNumber(merchantStoreId, orderDate, cfg.orderNumberRolloverAfter)
    const pickupCode = cfg.requirePickupCode ? generatePickupCode(orderNumber) : null

    const order = await this.repo.createOrder({
      merchantStoreId,
      orderNumber,
      orderDate,
      userId: null,
      sessionToken,
      note,
      pickupCode,
    })

    await publishSessionEvent(sessionToken, {
      status: 'PREPARING',
      orderNumber: order.orderNumber,
    })

    await this.broadcastQueue(merchantStoreId)

    return { orderId: order.id, orderNumber: order.orderNumber, note: order.note }
  }

  async createOrderByPhone(params: {
    phoneNumber: string
    merchantStoreId: string
    note?: string | null
    vendorUserId: string
    vendorRoles: string[]
  }): Promise<{ orderId: string; orderNumber: number; note: string | null }> {
    const { phoneNumber, merchantStoreId, vendorUserId, vendorRoles } = params
    const note = this.normalizeStaffNote(params.note)

    // Normalize phone number
    const normalizedPhone = phoneNumber.trim()
    if (!normalizedPhone) {
      throw new ErrorWithStatus(400, 'Phone number is required')
    }

    await this.verifyVendorStoreAccess(vendorUserId, vendorRoles, merchantStoreId)
    await this.enforceActiveOrderLimit(merchantStoreId)

    // Check if user exists with this phone number
    const user = await this.prisma.user.findFirst({
      where: { phone: normalizedPhone },
      select: { id: true },
    })

    const cfg = await this.requireStoreQueueConfig(merchantStoreId)
    const tz = await getMerchantStoreTimezone(this.prisma, merchantStoreId)
    const orderDate = this.getOrderDate(tz)
    const orderNumber = await this.repo.generateOrderNumber(merchantStoreId, orderDate, cfg.orderNumberRolloverAfter)
    const pickupCode = cfg.requirePickupCode ? generatePickupCode(orderNumber) : null

    const order = await this.repo.createOrder({
      merchantStoreId,
      orderNumber,
      orderDate,
      userId: user?.id ?? null,
      sessionToken: null,
      note,
      pickupCode,
      phoneNumber: normalizedPhone,
    })

    // Get store name for SMS
    const store = await this.prisma.merchantStore.findUnique({
      where: { id: merchantStoreId },
      select: { name: true, merchantId: true },
    })

    if (store) {
      // Send SMS notification
      try {
        await OrderSmsService.sendOrderCreatedSms({
          phoneNumber: normalizedPhone,
          orderNumber: order.orderNumber,
          pickupCode: order.pickupCode,
          storeName: store.name,
        })
      } catch (err) {
        console.warn('Failed to send order created SMS:', err)
      }

      // Touch user-merchant activity if user exists
      if (user?.id) {
        await touchUserMerchantActivity(this.prisma, { userId: user.id, merchantId: store.merchantId })
      }
    }

    if (user?.id) {
      await publishUserEvent(user.id, {
        orderNumber: order.orderNumber,
        status: 'PREPARING',
        pickupCode: order.pickupCode,
      })
    }

    await this.broadcastQueue(merchantStoreId)

    return { orderId: order.id, orderNumber: order.orderNumber, note: order.note }
  }

  async markOrderReady(params: { orderId: string; vendorUserId: string; vendorRoles: string[] }) {
    const { orderId, vendorUserId, vendorRoles } = params

    const order = await this.repo.findOrderById(orderId)
    if (!order) throw new ErrorWithStatus(404, 'Order not found')
    if (order.status === OrderStatus.READY) throw new ErrorWithStatus(409, 'Order is already ready')
    if (order.status !== OrderStatus.PREPARING && order.status !== OrderStatus.DELAYED) {
      throw new ErrorWithStatus(409, 'Order cannot be marked ready from current status')
    }

    await this.verifyVendorStoreAccess(vendorUserId, vendorRoles, order.merchantStoreId)

    const cfg = await this.requireStoreQueueConfig(order.merchantStoreId)

    const updated = await this.repo.updateOrder(orderId, { status: OrderStatus.READY, readyAt: new Date() })

    if (order.userId) {
      try {
        const title = this.formatReadyNotificationPart(
          cfg.orderReadyPushTitle,
          order.orderNumber,
          DEFAULT_READY_PUSH_TITLE
        )
        const message = this.formatReadyNotificationPart(
          cfg.orderReadyPushBody,
          order.orderNumber,
          DEFAULT_READY_PUSH_BODY
        )
        await this.notificationService.sendPushNotification({
          userId: order.userId,
          category: 'GENERAL',
          type: 'ORDER_READY',
          title,
          message,
          metadata: {
            orderId: order.id,
            orderNumber: order.orderNumber,
            pickedUpExpectation: cfg.autoPickUpAfterReady ? 'AUTO_AFTER_DELAY_OR_MANUAL' : 'MANUAL_ONLY',
          },
          prisma: this.prisma,
        })
      } catch (err) {
        console.warn('Failed to send push notification for order ready:', err)
      }

      await publishUserEvent(order.userId, {
        orderNumber: order.orderNumber,
        status: 'READY',
        pickupCode: updated.pickupCode,
        readyAt: updated.readyAt,
      })
    }

    // Send SMS if order has phone number (Mode 4)
    const orderWithPhone = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: { phoneNumber: true, merchantStore: { select: { name: true } } },
    })

    if (orderWithPhone?.phoneNumber) {
      try {
        await OrderSmsService.sendOrderReadySms({
          phoneNumber: orderWithPhone.phoneNumber,
          orderNumber: order.orderNumber,
          pickupCode: updated.pickupCode,
          storeName: orderWithPhone.merchantStore.name,
        })
      } catch (err) {
        console.warn('Failed to send order ready SMS:', err)
      }
    }

    if (order.sessionToken) {
      await publishSessionEvent(order.sessionToken, {
        status: 'READY',
        orderNumber: order.orderNumber,
      })
    }

    await this.broadcastQueue(order.merchantStoreId)

    await this.scheduleAutoPickUpAfterReady(orderId, order.merchantStoreId)
    await this.scheduleReadyReminderAfterReady(order.id, order.merchantStoreId, order.userId)

    return updated
  }

  async markOrderPickedUp(params: { orderId: string; vendorUserId: string; vendorRoles: string[] }) {
    const { orderId, vendorUserId, vendorRoles } = params

    const order = await this.repo.findOrderById(orderId)
    if (!order) throw new ErrorWithStatus(404, 'Order not found')
    if (order.status !== OrderStatus.READY) {
      throw new ErrorWithStatus(409, 'Only READY orders can be marked picked up')
    }

    await this.verifyVendorStoreAccess(vendorUserId, vendorRoles, order.merchantStoreId)

    await this.removeArchiveJob(orderId)
    await cancelReadyReminderJob(orderId)

    const pickedUpAt = new Date()
    const updated = await this.repo.updateOrder(orderId, {
      status: OrderStatus.PICKED_UP,
      pickedUpSource: OrderPickUpSource.MANUAL,
      pickedUpAt,
    })

    await this.archiveOrderToHistory(order)

    if (order.sessionToken) {
      await publishSessionEvent(order.sessionToken, {
        status: 'PICKED_UP',
        orderNumber: order.orderNumber,
        pickedUpSource: OrderPickUpSource.MANUAL,
      })
    }

    await this.broadcastQueue(order.merchantStoreId)

    return updated
  }

  async cancelOrder(params: { orderId: string; vendorUserId: string; vendorRoles: string[] }) {
    const { orderId, vendorUserId, vendorRoles } = params

    const order = await this.repo.findOrderById(orderId)
    if (!order) throw new ErrorWithStatus(404, 'Order not found')
    if (
      order.status !== OrderStatus.PREPARING &&
      order.status !== OrderStatus.DELAYED &&
      order.status !== OrderStatus.READY
    ) {
      throw new ErrorWithStatus(409, 'Order cannot be cancelled from current status')
    }

    await this.verifyVendorStoreAccess(vendorUserId, vendorRoles, order.merchantStoreId)

    if (order.status === OrderStatus.READY) {
      await this.removeArchiveJob(orderId)
      await cancelReadyReminderJob(orderId)
    }

    const updated = await this.repo.updateOrder(orderId, { status: OrderStatus.CANCELLED })

    await this.archiveOrderToHistory(order)

    if (order.sessionToken) {
      await publishSessionEvent(order.sessionToken, {
        status: 'CANCELLED',
        orderNumber: order.orderNumber,
      })
    }

    await this.broadcastQueue(order.merchantStoreId)

    return updated
  }

  async markOrderDelayed(params: { orderId: string; vendorUserId: string; vendorRoles: string[] }) {
    const { orderId, vendorUserId, vendorRoles } = params

    const order = await this.repo.findOrderById(orderId)
    if (!order) throw new ErrorWithStatus(404, 'Order not found')
    if (order.status !== OrderStatus.PREPARING) {
      throw new ErrorWithStatus(409, 'Only PREPARING orders can be marked delayed')
    }

    await this.verifyVendorStoreAccess(vendorUserId, vendorRoles, order.merchantStoreId)

    const updated = await this.repo.updateOrder(orderId, { status: OrderStatus.DELAYED })

    if (order.userId) {
      await publishUserEvent(order.userId, {
        orderNumber: order.orderNumber,
        status: 'DELAYED',
        pickupCode: updated.pickupCode,
      })
    }

    if (order.sessionToken) {
      await publishSessionEvent(order.sessionToken, {
        status: 'DELAYED',
        orderNumber: order.orderNumber,
      })
    }

    await this.broadcastQueue(order.merchantStoreId)

    return updated
  }

  async markOrderResumePreparing(params: { orderId: string; vendorUserId: string; vendorRoles: string[] }) {
    const { orderId, vendorUserId, vendorRoles } = params

    const order = await this.repo.findOrderById(orderId)
    if (!order) throw new ErrorWithStatus(404, 'Order not found')
    if (order.status !== OrderStatus.DELAYED) {
      throw new ErrorWithStatus(409, 'Only DELAYED orders can return to preparing')
    }

    await this.verifyVendorStoreAccess(vendorUserId, vendorRoles, order.merchantStoreId)

    const updated = await this.repo.updateOrder(orderId, { status: OrderStatus.PREPARING, readyAt: null })

    if (order.userId) {
      await publishUserEvent(order.userId, {
        orderNumber: order.orderNumber,
        status: 'PREPARING',
        pickupCode: updated.pickupCode,
      })
    }

    if (order.sessionToken) {
      await publishSessionEvent(order.sessionToken, {
        status: 'PREPARING',
        orderNumber: order.orderNumber,
      })
    }

    await this.broadcastQueue(order.merchantStoreId)

    return updated
  }

  async buildQueuePayload(merchantStoreId: string): Promise<QueuePayload> {
    return computeQueuePayload(this.prisma, merchantStoreId)
  }

  async createWebOrderSession(storeId: string): Promise<{ sessionToken: string; expiresAt: Date }> {
    const exists = await this.repo.verifyStoreExists(storeId)
    if (!exists) throw new ErrorWithStatus(404, 'Store not found')

    const cfg = await this.requireStoreQueueConfig(storeId)
    const ttlMs = cfg.webSessionTtlMs

    const sessionToken = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + ttlMs)

    await this.repo.createWebOrderSession({ sessionToken, merchantStoreId: storeId, expiresAt })

    await sessionCleanupQueue?.add('cleanup-session', { sessionToken }, { delay: ttlMs })

    return { sessionToken, expiresAt }
  }

  getVenueQRCodeUrl(merchantStoreId: string): string {
    return `${ORDER_BASE_URL}/order/${merchantStoreId}`
  }

  generateUserQRToken(userId: string): { token: string; expiresAt: Date } {
    return { token: userId, expiresAt: new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000) }
  }

  async getActiveOrders(merchantStoreId: string) {
    const tz = await getMerchantStoreTimezone(this.prisma, merchantStoreId)
    const today = this.getOrderDate(tz)
    return this.repo.findActiveOrders(merchantStoreId, today)
  }

  async getRecentlyClosedOrders(merchantStoreId: string, limit: number) {
    const tz = await getMerchantStoreTimezone(this.prisma, merchantStoreId)
    const today = this.getOrderDate(tz)
    return this.repo.findRecentlyClosedOrders(merchantStoreId, today, limit)
  }

  async revertOrderPickUp(params: { orderId: string; vendorUserId: string; vendorRoles: string[] }) {
    const { orderId, vendorUserId, vendorRoles } = params

    const order = await this.repo.findOrderById(orderId)
    if (!order) throw new ErrorWithStatus(404, 'Order not found')
    if (order.status !== OrderStatus.PICKED_UP) {
      throw new ErrorWithStatus(409, 'Only picked-up orders can be restored to ready')
    }

    await this.verifyVendorStoreAccess(vendorUserId, vendorRoles, order.merchantStoreId)

    const updated = await this.repo.updateOrder(orderId, {
      status: OrderStatus.READY,
      pickedUpAt: null,
      pickedUpSource: null,
      readyAt: new Date(),
    })

    if (order.sessionToken) {
      await publishSessionEvent(order.sessionToken, {
        status: 'READY',
        orderNumber: order.orderNumber,
      })
    }

    await this.broadcastQueue(order.merchantStoreId)

    await this.scheduleAutoPickUpAfterReady(orderId, order.merchantStoreId)
    await this.scheduleReadyReminderAfterReady(order.id, order.merchantStoreId, order.userId)

    return updated
  }

  async revertOrderReady(params: { orderId: string; vendorUserId: string; vendorRoles: string[] }) {
    const { orderId, vendorUserId, vendorRoles } = params

    const order = await this.repo.findOrderById(orderId)
    if (!order) throw new ErrorWithStatus(404, 'Order not found')
    if (order.status !== OrderStatus.READY) {
      throw new ErrorWithStatus(409, 'Only READY orders can be moved back to preparing')
    }

    await this.verifyVendorStoreAccess(vendorUserId, vendorRoles, order.merchantStoreId)

    await this.removeArchiveJob(orderId)
    await cancelReadyReminderJob(orderId)

    const updated = await this.repo.updateOrder(orderId, { status: OrderStatus.PREPARING, readyAt: null })

    if (order.userId) {
      await publishUserEvent(order.userId, {
        orderNumber: order.orderNumber,
        status: 'PREPARING',
        pickupCode: updated.pickupCode,
      })
    }

    if (order.sessionToken) {
      await publishSessionEvent(order.sessionToken, {
        status: 'PREPARING',
        orderNumber: order.orderNumber,
      })
    }

    await this.broadcastQueue(order.merchantStoreId)

    return updated
  }

  private async archiveOrderToHistory(order: any): Promise<void> {
    try {
      await this.prisma.orderHistory.create({
        data: {
          orderId: order.id,
          merchantStoreId: order.merchantStoreId,
          orderNumber: order.orderNumber,
          status: order.status,
          userId: order.userId,
          sessionToken: order.sessionToken,
          phoneNumber: order.phoneNumber,
          orderDate: order.orderDate,
          pickupCode: order.pickupCode,
          pickedUpSource: order.pickedUpSource,
          pickedUpAt: order.pickedUpAt,
          readyAt: order.readyAt,
          note: order.note,
          createdAt: order.createdAt,
        },
      })
    } catch (err) {
      console.warn('Failed to archive order to history:', err)
    }
  }

  async getStoreOrderQueueConfigForVendor(params: {
    merchantStoreId: string
    vendorUserId: string
    vendorRoles: string[]
  }) {
    const { merchantStoreId, vendorUserId, vendorRoles } = params
    await this.verifyVendorStoreAccess(vendorUserId, vendorRoles, merchantStoreId)
    const storeExists = await this.prisma.merchantStore.findUnique({
      where: { id: merchantStoreId },
      select: { id: true },
    })
    if (!storeExists) throw new ErrorWithStatus(404, 'Store not found')
    return this.prisma.merchantStoreOrderQueueConfig.findUnique({
      where: { merchantStoreId },
      select: MERCHANT_STORE_ORDER_QUEUE_CONFIG_SELECT,
    })
  }

  async updateMerchantStoreOrderQueueSettings(params: {
    merchantStoreId: string
    vendorUserId: string
    vendorRoles: string[]
    orderArchiveDelayMs?: number
    maxActiveOrders?: number
    webSessionTtlMs?: number
    orderReadyPushTitle?: string | null
    orderReadyPushBody?: string | null
    orderNumberRolloverAfter?: number
    autoPickUpAfterReady?: boolean
    orderReadyReminderEnabled?: boolean
    orderReadyReminderDelayMs?: number
    requirePickupCode?: boolean
  }) {
    const {
      merchantStoreId,
      vendorUserId,
      vendorRoles,
      orderArchiveDelayMs,
      maxActiveOrders,
      webSessionTtlMs,
      orderReadyPushTitle,
      orderReadyPushBody,
      orderNumberRolloverAfter,
      autoPickUpAfterReady,
      orderReadyReminderEnabled,
      orderReadyReminderDelayMs,
      requirePickupCode,
    } = params

    await this.verifyVendorStoreAccess(vendorUserId, vendorRoles, merchantStoreId)

    if (maxActiveOrders !== undefined && maxActiveOrders < 1) {
      throw new ErrorWithStatus(400, 'maxActiveOrders must be at least 1')
    }
    if (orderNumberRolloverAfter !== undefined && orderNumberRolloverAfter < 1) {
      throw new ErrorWithStatus(400, 'orderNumberRolloverAfter must be at least 1')
    }
    if (webSessionTtlMs !== undefined && webSessionTtlMs < 60_000) {
      throw new ErrorWithStatus(400, 'webSessionTtlMs must be at least 60000')
    }
    if (orderArchiveDelayMs !== undefined && orderArchiveDelayMs < 0) {
      throw new ErrorWithStatus(400, 'orderArchiveDelayMs must be non-negative')
    }
    if (orderReadyReminderDelayMs !== undefined && orderReadyReminderDelayMs < 60_000) {
      throw new ErrorWithStatus(400, 'orderReadyReminderDelayMs must be at least 60000')
    }

    const storeExists = await this.prisma.merchantStore.findUnique({
      where: { id: merchantStoreId },
      select: { id: true },
    })
    if (!storeExists) throw new ErrorWithStatus(404, 'Store not found')

    const patch: MerchantStoreOrderQueueSettingsPatch = {
      orderArchiveDelayMs,
      maxActiveOrders,
      webSessionTtlMs,
      orderReadyPushTitle,
      orderReadyPushBody,
      orderNumberRolloverAfter,
      autoPickUpAfterReady,
      orderReadyReminderEnabled,
      orderReadyReminderDelayMs,
      requirePickupCode,
    }
    const data = definedOrderQueueConfigUpdateData(patch)

    const existing = await this.prisma.merchantStoreOrderQueueConfig.findUnique({
      where: { merchantStoreId },
      select: { id: true },
    })

    if (existing) {
      return this.prisma.merchantStoreOrderQueueConfig.update({
        where: { merchantStoreId },
        select: MERCHANT_STORE_ORDER_QUEUE_CONFIG_SELECT,
        data,
      })
    }

    return this.prisma.merchantStoreOrderQueueConfig.create({
      data: merchantStoreOrderQueueConfigCreateData(merchantStoreId, patch),
      select: MERCHANT_STORE_ORDER_QUEUE_CONFIG_SELECT,
    })
  }
}
