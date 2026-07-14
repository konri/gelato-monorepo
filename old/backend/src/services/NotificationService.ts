import * as admin from 'firebase-admin'
import { notificationQueue } from '../queues/notificationQueue'

// Initialize Firebase Admin (only once) - skip if credentials missing
const hasFirebaseCredentials =
  process.env.FIREBASE_PROJECT_ID &&
  process.env.FIREBASE_CLIENT_EMAIL &&
  process.env.FIREBASE_PRIVATE_KEY &&
  !process.env.FIREBASE_PRIVATE_KEY.includes('...')

if (hasFirebaseCredentials && !admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    })
    console.log('✅ Firebase Admin initialized')
  } catch (error) {
    console.warn('⚠️  Firebase Admin initialization failed:', error)
  }
} else {
  console.warn('⚠️  Firebase credentials not configured - push notifications disabled')
}

export class NotificationService {
  private static instance: NotificationService

  static getInstance() {
    if (!this.instance) this.instance = new NotificationService()
    return this.instance
  }

  async sendPushNotification(params: {
    userId: string
    category: 'GENERAL' | 'PROMOTIONS'
    type: string
    title: string
    message: string
    imageUrl?: string
    metadata?: any
    prisma: any
  }) {
    const { userId, category, type, title, message, imageUrl, metadata, prisma } = params

    // 1. Save to database (synchronous)
    const notification = await prisma.notification.create({
      data: {
        userId,
        category,
        type,
        title,
        message,
        imageUrl,
        metadata,
      },
    })

    // 2. Get FCM tokens
    const devices = await prisma.userDevice.findMany({
      where: { userId, isActive: true },
      select: { fcmToken: true },
    })

    if (devices.length === 0) {
      console.log('📦 Notification saved to DB (no devices registered)')
      return notification
    }

    // 3. Add to queue (asynchronous) - instant response!
    try {
      await notificationQueue?.add(
        'send-push',
        {
          notificationId: notification.id,
          userId,
          category,
          type,
          title,
          message,
          metadata,
          fcmTokens: devices.map((d: any) => d.fcmToken),
        },
        {
          attempts: 3,
          backoff: { type: 'exponential', delay: 2000 },
          removeOnComplete: true,
          removeOnFail: false,
        }
      )
      console.log('✅ Notification queued for push delivery')
    } catch (error) {
      console.warn('⚠️  Failed to queue notification:', error)
    }

    return notification
  }

  // Bulk notifications (e.g., marketing campaigns)
  async sendBulkNotifications(
    notifications: Array<{
      userId: string
      category: 'GENERAL' | 'PROMOTIONS'
      type: string
      title: string
      message: string
      imageUrl?: string
      metadata?: any
    }>,
    prisma: any
  ) {
    const jobs = []

    for (const notif of notifications) {
      const devices = await prisma.userDevice.findMany({
        where: { userId: notif.userId, isActive: true },
        select: { fcmToken: true },
      })

      if (devices.length > 0) {
        jobs.push({
          name: 'send-push',
          data: {
            userId: notif.userId,
            category: notif.category,
            type: notif.type,
            title: notif.title,
            message: notif.message,
            metadata: notif.metadata,
            fcmTokens: devices.map((d: any) => d.fcmToken),
          },
          opts: { attempts: 3 },
        })
      }
    }

    if (jobs.length > 0) {
      await notificationQueue?.addBulk(jobs)
    }
  }
}
