-- CreateEnum
CREATE TYPE "NotificationCategory" AS ENUM ('GENERAL', 'PROMOTIONS', 'SECURITY');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('STAMP_ADDED', 'STAMP_CARD_COMPLETED', 'STAMP_MILESTONE_REACHED', 'POINTS_EARNED', 'POINTS_SPENT', 'COUPON_CLAIMED', 'VOUCHER_PURCHASED', 'BIRTHDAY_REWARD', 'REFERRAL_COMPLETED', 'REFERRAL_REWARD_EARNED', 'REWARD_UNLOCKED', 'ACHIEVEMENT_UNLOCKED', 'COUPON_AVAILABLE', 'COUPON_EXPIRING', 'VOUCHER_EXPIRING', 'MERCHANT_PROMOTION', 'SPECIAL_OFFER', 'NEW_REWARD_AVAILABLE', 'FLASH_SALE', 'LIMITED_TIME_OFFER', 'NEW_LOGIN', 'NEW_DEVICE', 'PASSWORD_CHANGED', 'EMAIL_CHANGED', 'SUSPICIOUS_ACTIVITY', 'ACCOUNT_LOCKED', 'TWO_FACTOR_ENABLED', 'APP_UPDATE_AVAILABLE', 'MAINTENANCE_SCHEDULED', 'SYSTEM_ANNOUNCEMENT', 'EVENT_REMINDER', 'SUBSCRIPTION_EXPIRING', 'PAYMENT_FAILED', 'TERMS_UPDATED');

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "category" "NotificationCategory" NOT NULL DEFAULT 'GENERAL',
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "imageUrl" TEXT,
    "metadata" JSONB,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "isSent" BOOLEAN NOT NULL DEFAULT false,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserDevice" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fcmToken" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "deviceName" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserDevice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Notification_userId_isRead_idx" ON "Notification"("userId", "isRead");

-- CreateIndex
CREATE INDEX "Notification_userId_category_idx" ON "Notification"("userId", "category");

-- CreateIndex
CREATE INDEX "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "UserDevice_fcmToken_key" ON "UserDevice"("fcmToken");

-- CreateIndex
CREATE UNIQUE INDEX "UserDevice_userId_deviceId_key" ON "UserDevice"("userId", "deviceId");

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserDevice" ADD CONSTRAINT "UserDevice_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
