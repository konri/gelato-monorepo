import { ObjectType, Field, ID, registerEnumType } from 'type-graphql'
import GraphQLJSON from 'graphql-type-json'

export enum NotificationCategory {
  GENERAL = 'GENERAL',
  PROMOTIONS = 'PROMOTIONS',
  SECURITY = 'SECURITY',
}

export enum NotificationType {
  // GENERAL - User activities & rewards
  STAMP_ADDED = 'STAMP_ADDED',
  STAMP_CARD_COMPLETED = 'STAMP_CARD_COMPLETED',
  STAMP_MILESTONE_REACHED = 'STAMP_MILESTONE_REACHED',
  POINTS_EARNED = 'POINTS_EARNED',
  POINTS_SPENT = 'POINTS_SPENT',
  COUPON_CLAIMED = 'COUPON_CLAIMED',
  VOUCHER_PURCHASED = 'VOUCHER_PURCHASED',
  BIRTHDAY_REWARD = 'BIRTHDAY_REWARD',
  REFERRAL_COMPLETED = 'REFERRAL_COMPLETED',
  REFERRAL_REWARD_EARNED = 'REFERRAL_REWARD_EARNED',
  REWARD_UNLOCKED = 'REWARD_UNLOCKED',
  ACHIEVEMENT_UNLOCKED = 'ACHIEVEMENT_UNLOCKED',

  // PROMOTIONS - Marketing & offers
  COUPON_AVAILABLE = 'COUPON_AVAILABLE',
  COUPON_EXPIRING = 'COUPON_EXPIRING',
  VOUCHER_EXPIRING = 'VOUCHER_EXPIRING',
  MERCHANT_PROMOTION = 'MERCHANT_PROMOTION',
  SPECIAL_OFFER = 'SPECIAL_OFFER',
  NEW_REWARD_AVAILABLE = 'NEW_REWARD_AVAILABLE',
  FLASH_SALE = 'FLASH_SALE',
  LIMITED_TIME_OFFER = 'LIMITED_TIME_OFFER',

  // SECURITY - Account & security alerts
  NEW_LOGIN = 'NEW_LOGIN',
  NEW_DEVICE = 'NEW_DEVICE',
  PASSWORD_CHANGED = 'PASSWORD_CHANGED',
  EMAIL_CHANGED = 'EMAIL_CHANGED',
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
  TWO_FACTOR_ENABLED = 'TWO_FACTOR_ENABLED',

  // SYSTEM - App updates & reminders
  APP_UPDATE_AVAILABLE = 'APP_UPDATE_AVAILABLE',
  MAINTENANCE_SCHEDULED = 'MAINTENANCE_SCHEDULED',
  SYSTEM_ANNOUNCEMENT = 'SYSTEM_ANNOUNCEMENT',
  EVENT_REMINDER = 'EVENT_REMINDER',
  SUBSCRIPTION_EXPIRING = 'SUBSCRIPTION_EXPIRING',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  TERMS_UPDATED = 'TERMS_UPDATED',
}

registerEnumType(NotificationCategory, {
  name: 'NotificationCategory',
})

registerEnumType(NotificationType, {
  name: 'NotificationType',
})

@ObjectType()
export class PushNotification {
  @Field(() => ID)
  id: string

  @Field()
  userId: string

  @Field(() => NotificationCategory)
  category: NotificationCategory

  @Field(() => NotificationType)
  type: NotificationType

  @Field()
  title: string

  @Field()
  message: string

  @Field({ nullable: true })
  imageUrl?: string

  @Field(() => GraphQLJSON, { nullable: true })
  metadata?: any

  @Field()
  isRead: boolean

  @Field({ nullable: true })
  readAt?: Date

  @Field()
  isSent: boolean

  @Field({ nullable: true })
  sentAt?: Date

  @Field()
  createdAt: Date
}

@ObjectType()
export class PushNotificationCount {
  @Field(() => NotificationCategory)
  category: NotificationCategory

  @Field()
  count: number
}
