import { Queue, Worker } from 'bullmq'
import { redis, REDIS_ENABLED } from '../Config/redis'
import * as admin from 'firebase-admin'
import prisma from '../shared/prisma'

export const notificationQueue = REDIS_ENABLED
  ? new Queue('notifications', {
      connection: redis as any,
    })
  : null

// Worker - processes push notifications in background
export const notificationWorker = REDIS_ENABLED
  ? new Worker(
      'notifications',
      async (job) => {
        const { notificationId, fcmTokens, title, message, type, metadata, userId, category } = job.data

        try {
          // Check if Firebase is initialized
          if (!admin.apps.length) {
            console.warn('⚠️  Firebase not initialized - skipping push notification')
            await prisma.notification.update({
              where: { id: notificationId },
              data: { isSent: false },
            })
            return
          }

          // Batch send (FCM supports max 500 tokens per request)
          const batches: string[][] = chunkArray(fcmTokens, 500)

          for (const batch of batches) {
            const response = await admin.messaging().sendEachForMulticast({
              tokens: batch,
              notification: {
                title,
                body: message,
              },
              data: {
                type,
                category,
                notificationId,
                ...metadata,
              },
              android: {
                priority: 'high',
                notification: {
                  sound: 'default',
                  channelId: category === 'PROMOTIONS' ? 'promotions' : 'general',
                },
              },
              apns: {
                payload: {
                  aps: {
                    sound: 'default',
                    badge: await getUnreadCount(userId),
                    category: category === 'PROMOTIONS' ? 'PROMOTIONS' : 'GENERAL',
                  },
                },
              },
            })

            // Handle invalid tokens
            response.responses.forEach((resp, idx) => {
              if (!resp.success) {
                const errorCode = resp.error?.code
                if (
                  errorCode === 'messaging/invalid-registration-token' ||
                  errorCode === 'messaging/registration-token-not-registered'
                ) {
                  // Deactivate invalid token
                  prisma.userDevice
                    .updateMany({
                      where: { fcmToken: batch[idx] },
                      data: { isActive: false },
                    })
                    .catch((err) => console.error('Error deactivating token:', err))
                }
              }
            })
          }

          // Mark notification as sent
          await prisma.notification.update({
            where: { id: notificationId },
            data: { isSent: true, sentAt: new Date() },
          })
        } catch (error) {
          console.error('FCM error:', error)
          throw error // Retry by BullMQ
        }
      },
      {
        connection: redis as any,
        concurrency: 5,
        stalledInterval: 30000,
        limiter: {
          max: 50,
          duration: 1000,
        },
      }
    )
  : null

if (notificationWorker) {
  notificationWorker.on('completed', (job) => {
    console.log(`✅ Notification sent: ${job.id}`)
  })

  notificationWorker.on('failed', (job, err: Error) => {
    console.error(`❌ Notification failed: ${job?.id}`, err)
  })
}

// Helper functions
function chunkArray<T>(array: T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(array.length / size) }, (_, i) => array.slice(i * size, i * size + size))
}

async function getUnreadCount(userId: string): Promise<number> {
  return prisma.notification.count({
    where: { userId, isRead: false },
  })
}
