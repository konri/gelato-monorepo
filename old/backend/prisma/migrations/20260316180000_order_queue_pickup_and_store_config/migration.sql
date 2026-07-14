CREATE TYPE "OrderPickUpSource" AS ENUM ('MANUAL', 'AUTO_AFTER_READY_DELAY');

ALTER TYPE "OrderStatus" ADD VALUE 'DELAYED';
ALTER TYPE "OrderStatus" ADD VALUE 'CANCELLED';

ALTER TABLE "Order" ADD COLUMN "pickedUpAt" TIMESTAMP(3),
ADD COLUMN "pickedUpSource" "OrderPickUpSource";

CREATE TABLE "MerchantStoreOrderQueueConfig" (
    "id" TEXT NOT NULL,
    "merchantStoreId" TEXT NOT NULL,
    "orderArchiveDelayMs" INTEGER NOT NULL DEFAULT 1800000,
    "maxActiveOrders" INTEGER NOT NULL DEFAULT 500,
    "webSessionTtlMs" INTEGER NOT NULL DEFAULT 7200000,
    "orderReadyPushTitle" TEXT,
    "orderReadyPushBody" TEXT,
    "orderNumberRolloverAfter" INTEGER NOT NULL DEFAULT 100,
    "autoPickUpAfterReady" BOOLEAN NOT NULL DEFAULT true,
    "orderReadyReminderEnabled" BOOLEAN NOT NULL DEFAULT false,
    "orderReadyReminderDelayMs" INTEGER NOT NULL DEFAULT 900000,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MerchantStoreOrderQueueConfig_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MerchantStoreOrderQueueConfig_merchantStoreId_key" ON "MerchantStoreOrderQueueConfig"("merchantStoreId");

ALTER TABLE "MerchantStoreOrderQueueConfig" ADD CONSTRAINT "MerchantStoreOrderQueueConfig_merchantStoreId_fkey" FOREIGN KEY ("merchantStoreId") REFERENCES "MerchantStore"("id") ON DELETE CASCADE ON UPDATE CASCADE;
