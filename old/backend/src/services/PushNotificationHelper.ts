import { NotificationService } from './NotificationService'
import { NotificationType } from '@prisma/client'

export class PushNotificationHelper {
  static async sendStampAdded(params: {
    userId: string
    merchantName: string
    stampsCollected: number
    stampsRequired: number
    prisma: any
  }) {
    const { userId, merchantName, stampsCollected, stampsRequired, prisma } = params

    await NotificationService.getInstance().sendPushNotification({
      userId,
      category: 'GENERAL',
      type: NotificationType.STAMP_ADDED,
      title: '🎉 Nowa pieczątka!',
      message: `Otrzymałeś pieczątkę w ${merchantName}. Masz ${stampsCollected}/${stampsRequired}`,
      prisma,
    })
  }

  static async sendStampCardCompleted(params: {
    userId: string
    merchantName: string
    rewardTitle?: string
    prisma: any
  }) {
    const { userId, merchantName, rewardTitle, prisma } = params

    await NotificationService.getInstance().sendPushNotification({
      userId,
      category: 'GENERAL',
      type: NotificationType.STAMP_CARD_COMPLETED,
      title: '🎁 Karta ukończona!',
      message: `Gratulacje! Zrealizowałeś kartę w ${merchantName}. ${rewardTitle ? `Nagroda: ${rewardTitle}` : ''}`,
      prisma,
    })
  }

  static async sendStampMilestoneReached(params: {
    userId: string
    merchantName: string
    milestoneTitle: string
    prisma: any
  }) {
    const { userId, merchantName, milestoneTitle, prisma } = params

    await NotificationService.getInstance().sendPushNotification({
      userId,
      category: 'GENERAL',
      type: NotificationType.STAMP_MILESTONE_REACHED,
      title: '⭐ Nagroda pośrednia!',
      message: `Odbierz nagrodę w ${merchantName}: ${milestoneTitle}`,
      prisma,
    })
  }

  static async sendPointsEarned(params: {
    userId: string
    amount: number
    merchantName?: string
    description: string
    prisma: any
  }) {
    const { userId, amount, merchantName, description, prisma } = params

    await NotificationService.getInstance().sendPushNotification({
      userId,
      category: 'GENERAL',
      type: NotificationType.POINTS_EARNED,
      title: '💰 Otrzymano punkty!',
      message: `+${amount} punktów${merchantName ? ` w ${merchantName}` : ''}. ${description}`,
      prisma,
    })
  }

  static async sendCouponAvailable(params: {
    userId: string
    couponTitle: string
    merchantName: string
    validUntil: Date
    prisma: any
  }) {
    const { userId, couponTitle, merchantName, validUntil, prisma } = params

    await NotificationService.getInstance().sendPushNotification({
      userId,
      category: 'PROMOTIONS',
      type: NotificationType.COUPON_AVAILABLE,
      title: '🎟️ Nowy kupon!',
      message: `${couponTitle} w ${merchantName}. Ważny do ${validUntil.toLocaleDateString('pl-PL')}`,
      prisma,
    })
  }

  static async sendCouponExpiring(params: {
    userId: string
    couponTitle: string
    merchantName: string
    hoursLeft: number
    prisma: any
  }) {
    const { userId, couponTitle, merchantName, hoursLeft, prisma } = params

    await NotificationService.getInstance().sendPushNotification({
      userId,
      category: 'PROMOTIONS',
      type: NotificationType.COUPON_EXPIRING,
      title: '⏰ Kupon wygasa!',
      message: `${couponTitle} w ${merchantName} wygasa za ${hoursLeft}h`,
      prisma,
    })
  }

  static async sendVoucherPurchased(params: {
    userId: string
    voucherTitle: string
    pointsSpent: number
    prisma: any
  }) {
    const { userId, voucherTitle, pointsSpent, prisma } = params

    await NotificationService.getInstance().sendPushNotification({
      userId,
      category: 'GENERAL',
      type: NotificationType.VOUCHER_PURCHASED,
      title: '🎫 Voucher zakupiony!',
      message: `${voucherTitle} za ${pointsSpent} punktów`,
      prisma,
    })
  }

  static async sendReferralCompleted(params: {
    userId: string
    referredUserName: string
    pointsEarned: number
    prisma: any
  }) {
    const { userId, referredUserName, pointsEarned, prisma } = params

    await NotificationService.getInstance().sendPushNotification({
      userId,
      category: 'GENERAL',
      type: NotificationType.REFERRAL_COMPLETED,
      title: '🤝 Polecenie zrealizowane!',
      message: `${referredUserName} dołączył dzięki Tobie! +${pointsEarned} punktów`,
      prisma,
    })
  }

  static async sendOrderReady(params: { userId: string; orderNumber: number; storeName: string; prisma: any }) {
    const { userId, orderNumber, storeName, prisma } = params

    await NotificationService.getInstance().sendPushNotification({
      userId,
      category: 'GENERAL',
      type: NotificationType.ORDER_READY,
      title: '✅ Zamówienie gotowe!',
      message: `Zamówienie #${orderNumber} w ${storeName} jest gotowe do odbioru`,
      prisma,
    })
  }
}
