import { Resolver, Query, Mutation, Arg, Ctx, Authorized, ID, Int, FieldResolver, Root } from 'type-graphql'
import { Context } from '../../shared/interface/Context'
import { Role } from '../../User/objectType/Role'
import { OrderService } from '../service/OrderService'
import { MerchantAccessService } from '../../shared/service/MerchantAccessService'
import { ErrorWithStatus } from '../../shared/interface/ErrorWithStatus'
import { Order } from '../objectType/Order'
import { CreateOrderResult } from '../objectType/CreateOrderResult'
import { VenueQRCodeResult } from '../objectType/VenueQRCodeResult'
import { UserQRCodeResult } from '../objectType/UserQRCodeResult'
import { CreateOrderByUserQRInput } from '../inputType/CreateOrderByUserQRInput'
import { CreateOrderBySessionInput } from '../inputType/CreateOrderBySessionInput'
import { CreateOrderByPhoneInput } from '../inputType/CreateOrderByPhoneInput'
import { MarkOrderReadyInput } from '../inputType/MarkOrderReadyInput'
import { OrderByIdInput } from '../inputType/OrderByIdInput'
import { UpdateMerchantStoreOrderQueueInput } from '../inputType/UpdateMerchantStoreOrderQueueInput'
import { MerchantStoreOrderQueueConfig } from '../objectType/MerchantStoreOrderQueueConfig'
import { MerchantStore } from '../../Merchant/objectType/MerchantStore'
import { User } from '../../User/objectType/User'

@Resolver(() => Order)
export class OrderResolver {
  private getService(ctx: Context): OrderService {
    return new OrderService(ctx.prisma)
  }

  // Helper to normalize statusHistory
  private normalizeStatusHistory(order: any): any {
    let history = order.statusHistory

    if (!Array.isArray(history)) {
      history = []
    }

    const validHistory = history
      .filter((entry: any) => entry && entry.status && entry.timestamp)
      .map((entry: any) => ({
        status: entry.status,
        timestamp: typeof entry.timestamp === 'string' ? new Date(entry.timestamp) : entry.timestamp,
      }))

    return {
      ...order,
      statusHistory: validHistory,
    }
  }

  // ── Field Resolvers ───────────────────────────────────────────────────────

  @FieldResolver(() => MerchantStore)
  async merchantStore(@Root() order: Order, @Ctx() ctx: Context): Promise<MerchantStore> {
    const store = await ctx.prisma.merchantStore.findUnique({
      where: { id: order.merchantStoreId },
      include: {
        merchant: true,
        category: true,
      },
    })
    if (!store) throw new ErrorWithStatus(404, 'Store not found')
    return store as any
  }

  // ── Mutations ──────────────────────────────────────────────────────────────

  @Authorized([Role.OWNER, Role.COOPERATOR, Role.ADMIN])
  @Mutation(() => CreateOrderResult)
  async createOrderByUserQR(
    @Arg('input') input: CreateOrderByUserQRInput,
    @Ctx() ctx: Context
  ): Promise<CreateOrderResult> {
    const user = ctx.req.user!
    return this.getService(ctx).createOrderByUserQR({
      userId: input.userId ?? null,
      merchantStoreId: input.merchantStoreId,
      note: input.note,
      vendorUserId: user.id,
      vendorRoles: user.roles,
    })
  }

  @Authorized([Role.OWNER, Role.COOPERATOR, Role.ADMIN])
  @Mutation(() => CreateOrderResult)
  async createOrderBySession(
    @Arg('input') input: CreateOrderBySessionInput,
    @Ctx() ctx: Context
  ): Promise<CreateOrderResult> {
    const user = ctx.req.user!
    return this.getService(ctx).createOrderBySession({
      sessionToken: input.sessionToken,
      merchantStoreId: input.merchantStoreId,
      note: input.note,
      vendorUserId: user.id,
      vendorRoles: user.roles,
    })
  }

  @Authorized([Role.OWNER, Role.COOPERATOR, Role.ADMIN])
  @Mutation(() => CreateOrderResult)
  async createOrderByPhone(
    @Arg('input') input: CreateOrderByPhoneInput,
    @Ctx() ctx: Context
  ): Promise<CreateOrderResult> {
    const user = ctx.req.user!
    return this.getService(ctx).createOrderByPhone({
      phoneNumber: input.phoneNumber,
      merchantStoreId: input.merchantStoreId,
      note: input.note,
      vendorUserId: user.id,
      vendorRoles: user.roles,
    })
  }

  @Authorized([Role.OWNER, Role.COOPERATOR, Role.ADMIN])
  @Mutation(() => Order)
  async markOrderReady(@Arg('input') input: MarkOrderReadyInput, @Ctx() ctx: Context): Promise<Order> {
    const user = ctx.req.user!
    const order = await this.getService(ctx).markOrderReady({
      orderId: input.orderId,
      vendorUserId: user.id,
      vendorRoles: user.roles,
    })
    return this.normalizeStatusHistory(order) as any
  }

  @Authorized([Role.OWNER, Role.COOPERATOR, Role.ADMIN])
  @Mutation(() => Order)
  async markOrderPickedUp(@Arg('input') input: OrderByIdInput, @Ctx() ctx: Context): Promise<Order> {
    const user = ctx.req.user!
    const order = await this.getService(ctx).markOrderPickedUp({
      orderId: input.orderId,
      vendorUserId: user.id,
      vendorRoles: user.roles,
    })
    return this.normalizeStatusHistory(order) as any
  }

  @Authorized([Role.OWNER, Role.COOPERATOR, Role.ADMIN])
  @Mutation(() => Order)
  async cancelOrder(@Arg('input') input: OrderByIdInput, @Ctx() ctx: Context): Promise<Order> {
    const user = ctx.req.user!
    const order = await this.getService(ctx).cancelOrder({
      orderId: input.orderId,
      vendorUserId: user.id,
      vendorRoles: user.roles,
    })
    return this.normalizeStatusHistory(order) as any
  }
  
  @Authorized([Role.OWNER, Role.COOPERATOR, Role.ADMIN])
  @Mutation(() => Order)
  async markOrderDelayed(@Arg('input') input: OrderByIdInput, @Ctx() ctx: Context): Promise<Order> {
    const user = ctx.req.user!
    const order = await this.getService(ctx).markOrderDelayed({
      orderId: input.orderId,
      vendorUserId: user.id,
      vendorRoles: user.roles,
    })
    return this.normalizeStatusHistory(order) as any
  }

  @Authorized([Role.OWNER, Role.COOPERATOR, Role.ADMIN])
  @Mutation(() => Order)
  async markOrderResumePreparing(@Arg('input') input: OrderByIdInput, @Ctx() ctx: Context): Promise<Order> {
    const user = ctx.req.user!
    const order = await this.getService(ctx).markOrderResumePreparing({
      orderId: input.orderId,
      vendorUserId: user.id,
      vendorRoles: user.roles,
    })
    return this.normalizeStatusHistory(order) as any
  }

  @Authorized([Role.OWNER, Role.COOPERATOR, Role.ADMIN])
  @Mutation(() => Order)
  async revertOrderPickUp(@Arg('input') input: OrderByIdInput, @Ctx() ctx: Context): Promise<Order> {
    const user = ctx.req.user!
    const order = await this.getService(ctx).revertOrderPickUp({
      orderId: input.orderId,
      vendorUserId: user.id,
      vendorRoles: user.roles,
    })
    return this.normalizeStatusHistory(order) as any
  }

  @Authorized([Role.OWNER, Role.COOPERATOR, Role.ADMIN])
  @Mutation(() => Order)
  async revertOrderReady(@Arg('input') input: OrderByIdInput, @Ctx() ctx: Context): Promise<Order> {
    const user = ctx.req.user!
    const order = await this.getService(ctx).revertOrderReady({
      orderId: input.orderId,
      vendorUserId: user.id,
      vendorRoles: user.roles,
    })
    return this.normalizeStatusHistory(order) as any
  }

  @Authorized([Role.OWNER, Role.COOPERATOR, Role.ADMIN])
  @Mutation(() => MerchantStoreOrderQueueConfig)
  async updateMerchantStoreOrderQueueSettings(
    @Arg('input') input: UpdateMerchantStoreOrderQueueInput,
    @Ctx() ctx: Context
  ): Promise<MerchantStoreOrderQueueConfig> {
    const user = ctx.req.user!
    return this.getService(ctx).updateMerchantStoreOrderQueueSettings({
      merchantStoreId: input.merchantStoreId,
      vendorUserId: user.id,
      vendorRoles: user.roles,
      orderArchiveDelayMs: input.orderArchiveDelayMs,
      maxActiveOrders: input.maxActiveOrders,
      webSessionTtlMs: input.webSessionTtlMs,
      orderReadyPushTitle: input.orderReadyPushTitle,
      orderReadyPushBody: input.orderReadyPushBody,
      orderNumberRolloverAfter: input.orderNumberRolloverAfter,
      autoPickUpAfterReady: input.autoPickUpAfterReady,
      orderReadyReminderEnabled: input.orderReadyReminderEnabled,
      orderReadyReminderDelayMs: input.orderReadyReminderDelayMs,
    }) as any
  }

  // ── Queries ────────────────────────────────────────────────────────────────

  @Authorized([Role.OWNER, Role.COOPERATOR, Role.ADMIN])
  @Query(() => [Order])
  async activeOrders(@Arg('merchantStoreId', () => ID) merchantStoreId: string, @Ctx() ctx: Context): Promise<Order[]> {
    const user = ctx.req.user!
    const merchantAccess = new MerchantAccessService(ctx.prisma)
    const store = await ctx.prisma.merchantStore.findUnique({
      where: { id: merchantStoreId },
      select: { merchantId: true },
    })
    if (!store) throw new ErrorWithStatus(404, 'Store not found')
    const hasAccess = await merchantAccess.ensureMerchantAccess(user.id, user.roles, store.merchantId)
    if (!hasAccess) throw new ErrorWithStatus(403, 'Access denied')

    const orders = (await this.getService(ctx).getActiveOrders(merchantStoreId)) as any

    // Enhanced sorting for vendor: group by user, prioritize READY orders
    const ordersWithUsers = await Promise.all(
      orders.map(async (order: any) => {
        if (order.userId) {
          const userData = await ctx.prisma.user.findUnique({
            where: { id: order.userId },
            select: { id: true, name: true, email: true, phone: true },
          })
          return { ...order, user: userData }
        }
        return { ...order, user: null }
      })
    )

    // Sort orders for vendor view: READY first, then group by user, then by order number
    return ordersWithUsers.sort((a, b) => {
      // 1. Status priority: READY > PREPARING > DELAYED
      const statusPriority = { READY: 1, PREPARING: 2, DELAYED: 3 } as const
      const aPriority = statusPriority[a.status as keyof typeof statusPriority] || 999
      const bPriority = statusPriority[b.status as keyof typeof statusPriority] || 999

      if (aPriority !== bPriority) {
        return aPriority - bPriority
      }

      // 2. Within same status, group by user (registered users first, then phone, then session)
      const getUserGroupKey = (order: any) => {
        if (order.userId && order.user) return `user_${order.userId}`
        if (order.phoneNumber) return `phone_${order.phoneNumber}`
        return `session_${order.id}`
      }

      const aGroupKey = getUserGroupKey(a)
      const bGroupKey = getUserGroupKey(b)

      if (aGroupKey !== bGroupKey) {
        // Registered users first, then phone orders, then sessions
        const aIsUser = aGroupKey.startsWith('user_')
        const bIsUser = bGroupKey.startsWith('user_')
        const aIsPhone = aGroupKey.startsWith('phone_')
        const bIsPhone = bGroupKey.startsWith('phone_')

        if (aIsUser && !bIsUser) return -1
        if (!aIsUser && bIsUser) return 1
        if (aIsPhone && !bIsPhone && !bIsUser) return -1
        if (!aIsPhone && bIsPhone && !aIsUser) return 1

        return aGroupKey.localeCompare(bGroupKey)
      }

      // 3. Within same user group, sort by order number
      return a.orderNumber - b.orderNumber
    }) as any
  }

  @Authorized([Role.OWNER, Role.COOPERATOR, Role.ADMIN])
  @Query(() => [Order])
  async recentClosedOrders(
    @Arg('merchantStoreId', () => ID) merchantStoreId: string,
    @Arg('limit', () => Int, { nullable: true }) limit: number | null,
    @Ctx() ctx: Context
  ): Promise<Order[]> {
    const user = ctx.req.user!
    const merchantAccess = new MerchantAccessService(ctx.prisma)
    const store = await ctx.prisma.merchantStore.findUnique({
      where: { id: merchantStoreId },
      select: { merchantId: true },
    })
    if (!store) throw new ErrorWithStatus(404, 'Store not found')
    const hasAccess = await merchantAccess.ensureMerchantAccess(user.id, user.roles, store.merchantId)
    if (!hasAccess) throw new ErrorWithStatus(403, 'Access denied')

    const resolvedLimit = limit != null && limit > 0 ? limit : 50
    return this.getService(ctx).getRecentlyClosedOrders(merchantStoreId, resolvedLimit) as any
  }

  @Authorized([Role.OWNER, Role.COOPERATOR, Role.ADMIN])
  @Query(() => MerchantStoreOrderQueueConfig, { nullable: true })
  async merchantStoreOrderQueueConfig(
    @Arg('merchantStoreId', () => ID) merchantStoreId: string,
    @Ctx() ctx: Context
  ): Promise<MerchantStoreOrderQueueConfig | null> {
    const user = ctx.req.user!
    return this.getService(ctx).getStoreOrderQueueConfigForVendor({
      merchantStoreId,
      vendorUserId: user.id,
      vendorRoles: user.roles,
    })
  }

  @Authorized([Role.OWNER, Role.COOPERATOR, Role.ADMIN])
  @Query(() => VenueQRCodeResult)
  async venueQRCode(
    @Arg('merchantStoreId', () => ID) merchantStoreId: string,
    @Ctx() ctx: Context
  ): Promise<VenueQRCodeResult> {
    const user = ctx.req.user!
    const merchantAccess = new MerchantAccessService(ctx.prisma)
    const store = await ctx.prisma.merchantStore.findUnique({
      where: { id: merchantStoreId },
      select: { merchantId: true },
    })
    if (!store) throw new ErrorWithStatus(404, 'Store not found')
    const hasAccess = await merchantAccess.ensureMerchantAccess(user.id, user.roles, store.merchantId)
    if (!hasAccess) throw new ErrorWithStatus(403, 'Access denied')

    const url = this.getService(ctx).getVenueQRCodeUrl(merchantStoreId)
    return { url, storeId: merchantStoreId }
  }

  @Authorized([Role.CLIENT])
  @Query(() => UserQRCodeResult)
  async myQRCode(@Ctx() ctx: Context): Promise<UserQRCodeResult> {
    const user = ctx.req.user!
    // QR encodes userId directly — static, no expiry
    return { token: user.id, expiresAt: new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000) }
  }

  @Authorized([Role.CLIENT])
  @Query(() => Order, { nullable: true })
  async myActiveOrder(@Ctx() ctx: Context): Promise<Order | null> {
    const user = ctx.req.user!
    const order = await ctx.prisma.order.findFirst({
      where: {
        userId: user.id,
        status: { in: ['PREPARING', 'DELAYED', 'READY'] },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        merchantStore: true,
      },
    })
    return order as any
  }

  @Authorized([Role.CLIENT])
  @Query(() => [Order])
  async myActiveOrders(@Ctx() ctx: Context): Promise<Order[]> {
    const user = ctx.req.user!
    const orders = await ctx.prisma.order.findMany({
      where: {
        userId: user.id,
        status: { in: ['READY', 'PREPARING', 'DELAYED', 'CANCELLED', 'PICKED_UP'] },
      },
      include: {
        merchantStore: true,
      },
    })

    // Ensure statusHistory exists for old orders and filter out invalid entries
    const ordersWithHistory = orders.map((order) => this.normalizeStatusHistory(order))

    // Custom sorting: READY (by readyAt) > PREPARING (by createdAt) > DELAYED (by createdAt) > CANCELLED (by createdAt) > PICKED_UP (by pickedUpAt)
    return ordersWithHistory.sort((a, b) => {
      // Priority order: READY = 1, PREPARING = 2, DELAYED = 3, CANCELLED = 4, PICKED_UP = 5
      const statusPriority = {
        READY: 1,
        PREPARING: 2,
        DELAYED: 3,
        CANCELLED: 4,
        PICKED_UP: 5,
      } as const

      const aPriority = statusPriority[a.status as keyof typeof statusPriority] || 999
      const bPriority = statusPriority[b.status as keyof typeof statusPriority] || 999

      // First sort by status priority
      if (aPriority !== bPriority) {
        return aPriority - bPriority
      }

      // Within same status, sort by appropriate timestamp
      if (a.status === 'READY' && b.status === 'READY') {
        // READY orders: earliest readyAt first (most urgent)
        const aTime = a.readyAt?.getTime() || 0
        const bTime = b.readyAt?.getTime() || 0
        return aTime - bTime
      }

      if (a.status === 'PICKED_UP' && b.status === 'PICKED_UP') {
        // PICKED_UP orders: latest pickedUpAt first (most recent)
        const aTime = a.pickedUpAt?.getTime() || 0
        const bTime = b.pickedUpAt?.getTime() || 0
        return bTime - aTime
      }

      // For PREPARING, DELAYED, CANCELLED: latest createdAt first
      return b.createdAt.getTime() - a.createdAt.getTime()
    }) as any
  }
}
