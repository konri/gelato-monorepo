import * as admin from 'firebase-admin'

import { messaging } from 'firebase-admin'
import prisma from '../prisma'
import TokenMessage = messaging.TokenMessage

export interface BaseMessage {
  data?: {
    [key: string]: string
  }
  notification?: {
    /**
     * The title of the notification.
     */
    title?: string
    /**
     * The notification body
     */
    body?: string
    /**
     * URL of an image to be displayed in the notification.
     */
    imageUrl?: string
  }
}

// Function to send a single FCM notification
async function sendSingleNotification(registrationToken: string, message: BaseMessage) {
  const notification: TokenMessage = {
    ...message,
    token: registrationToken,
  }
  return admin.messaging().send(notification)
}

// Function to send multiple FCM notifications
async function sendMultipleNotifications(registrationToken: Array<string>, message: BaseMessage) {
  const notifications: Array<TokenMessage> = registrationToken.map((token) => ({
    ...message,
    token,
  }))
  return admin
    .messaging()
    .sendEach(notifications)
    .then((res) => {
      console.log('sendMultipleNotifications success', res)
      return res
    })
    .catch((err) => {
      console.error('sendMultipleNotifications', sendMultipleNotifications)
    })
}

export interface NotificationForUser {
  title: string
  body: string
  imageUrl?: string
  additionalParams?: { [key: string]: string }
}

async function sendNotificationForUser(
  receiverId: string | undefined,
  creatorId: string | undefined,
  message: NotificationForUser
) {
  const notificationTokens = await prisma.notificationToken.findMany({
    where: {
      userId: receiverId,
    },
  })

  const { title, body, imageUrl, additionalParams } = message

  const notification = await prisma.notificationList.create({
    data: {
      title,
      body,
      image: imageUrl,
      additionalParams,
      user: { connect: { id: receiverId } },
      creator: { connect: { id: creatorId } },
    },
  })

  if (notificationTokens.length === 0) {
    return
  }

  const notificationToSend: BaseMessage = {
    notification: {
      title,
      body,
      imageUrl,
    },
    data: {
      ...additionalParams,
      notificationId: notification.id,
    },
  }
  const tokens = notificationTokens.map((token) => token.token)
  await sendMultipleNotifications(tokens, notificationToSend)
}

// Export functions for use in other modules
export { sendSingleNotification, sendMultipleNotifications, sendNotificationForUser }
