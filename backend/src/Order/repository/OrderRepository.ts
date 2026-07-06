import { Prisma, PrismaClient, OrderStatus } from '@prisma/client'

type CreateOrderData = {
  merchantStoreId: string
  orderNumber: number
  orderDate: Date
  userId?: string | null
  sessionToken?: string | null
  note?: string | null
  pickupCode?: string | null
  phoneNumber?: string | null
}

type CreateWebOrderSessionData = {
  sessionToken: string
  merchantStoreId: string
  expiresAt: Date
}

const OPEN_ORDER_STATUSES: OrderStatus[] = [OrderStatus.PREPARING, OrderStatus.DELAYED, OrderStatus.READY]

const CLOSED_HISTORY_STATUSES: OrderStatus[] = [OrderStatus.PICKED_UP]

function effectiveOrderNumberRollover(rolloverAfter: number): number {
  return rolloverAfter >= 1 ? rolloverAfter : 100
}

function applyOrderNumberRollover(raw: number, rolloverMax: number): number {
  return ((raw - 1) % rolloverMax) + 1
}

export class OrderRepository {
  constructor(private prisma: PrismaClient) {}

  async generateOrderNumber(merchantStoreId: string, orderDate: Date, rolloverAfter: number): Promise<number> {
    const rolloverMax = effectiveOrderNumberRollover(rolloverAfter)

    return this.prisma.$transaction(async (tx) => {
      const counter = await tx.orderCounter.upsert({
        where: {
          merchantStoreId_date: {
            merchantStoreId,
            date: orderDate,
          },
        },
        create: {
          merchantStoreId,
          date: orderDate,
          lastNumber: 1,
        },
        update: {
          lastNumber: { increment: 1 },
        },
        select: { lastNumber: true },
      })

      const raw = counter.lastNumber
      const wrapped = applyOrderNumberRollover(raw, rolloverMax)

      if (wrapped !== raw) {
        await tx.orderCounter.update({
          where: {
            merchantStoreId_date: {
              merchantStoreId,
              date: orderDate,
            },
          },
          data: { lastNumber: wrapped },
        })
      }

      return wrapped
    })
  }

  async createOrder(data: CreateOrderData) {
    const statusHistory = [
      {
        status: 'PREPARING',
        timestamp: new Date(),
      },
    ]
    return this.prisma.order.create({ data: { ...data, statusHistory } })
  }

  async findOrderById(id: string) {
    return this.prisma.order.findUnique({ where: { id } })
  }

  async updateOrder(id: string, data: Prisma.OrderUpdateInput) {
    // If status is being updated, append to statusHistory
    if (data.status) {
      const order = await this.prisma.order.findUnique({ where: { id }, select: { statusHistory: true } })
      const currentHistory = (order?.statusHistory as any[]) || []
      const newHistory = [
        ...currentHistory,
        {
          status: data.status,
          timestamp: new Date(),
        },
      ]
      return this.prisma.order.update({ where: { id }, data: { ...data, statusHistory: newHistory } })
    }
    return this.prisma.order.update({ where: { id }, data })
  }

  async updateOrderStatus(id: string, status: OrderStatus) {
    return this.prisma.order.update({ where: { id }, data: { status } })
  }

  async findActiveOrders(merchantStoreId: string, today: Date) {
    return this.prisma.order.findMany({
      where: {
        merchantStoreId,
        orderDate: today,
        status: { in: OPEN_ORDER_STATUSES },
      },
      orderBy: { orderNumber: 'asc' },
    })
  }

  async findRecentlyClosedOrders(merchantStoreId: string, today: Date, limit: number) {
    const take = Math.min(Math.max(limit, 1), 100)
    return this.prisma.order.findMany({
      where: {
        merchantStoreId,
        orderDate: today,
        status: { in: CLOSED_HISTORY_STATUSES },
      },
      orderBy: [{ pickedUpAt: 'desc' }, { updatedAt: 'desc' }],
      take,
    })
  }

  async findNextOrder(merchantStoreId: string) {
    return this.prisma.order.findFirst({
      where: { merchantStoreId, status: OrderStatus.PREPARING },
      orderBy: { orderNumber: 'asc' },
    })
  }

  async countActiveOrders(merchantStoreId: string): Promise<number> {
    return this.prisma.order.count({
      where: {
        merchantStoreId,
        status: { in: OPEN_ORDER_STATUSES },
      },
    })
  }

  async createWebOrderSession(data: CreateWebOrderSessionData) {
    return this.prisma.webOrderSession.create({ data })
  }

  async findWebOrderSession(sessionToken: string) {
    return this.prisma.webOrderSession.findUnique({ where: { sessionToken } })
  }

  async findOrderBySessionToken(sessionToken: string) {
    return this.prisma.order.findFirst({ where: { sessionToken } })
  }

  async findTodayOrdersByStore(merchantStoreId: string, today: Date) {
    return this.prisma.order.findMany({
      where: {
        merchantStoreId,
        orderDate: today,
        status: { in: OPEN_ORDER_STATUSES },
      },
      orderBy: { orderNumber: 'asc' },
    })
  }

  async verifyStoreExists(merchantStoreId: string): Promise<boolean> {
    const store = await this.prisma.merchantStore.findUnique({
      where: { id: merchantStoreId },
      select: { id: true, isActive: true },
    })
    return !!store && store.isActive
  }
}
