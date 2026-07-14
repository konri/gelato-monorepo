-- Add pickupCode, readyAt to Order table
ALTER TABLE "Order" ADD COLUMN "pickupCode" TEXT;
ALTER TABLE "Order" ADD COLUMN "readyAt" TIMESTAMP(3);

-- Add requirePickupCode to MerchantStoreOrderQueueConfig
ALTER TABLE "MerchantStoreOrderQueueConfig" ADD COLUMN "requirePickupCode" BOOLEAN NOT NULL DEFAULT true;

-- Create OrderHistory table for backup and statistics
CREATE TABLE "OrderHistory" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "merchantStoreId" TEXT NOT NULL,
    "orderNumber" INTEGER NOT NULL,
    "status" "OrderStatus" NOT NULL,
    "userId" TEXT,
    "sessionToken" TEXT,
    "orderDate" TIMESTAMP(3) NOT NULL,
    "pickupCode" TEXT,
    "pickedUpSource" "OrderPickUpSource",
    "pickedUpAt" TIMESTAMP(3),
    "readyAt" TIMESTAMP(3),
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderHistory_pkey" PRIMARY KEY ("id")
);

-- Create indexes for OrderHistory
CREATE INDEX "OrderHistory_merchantStoreId_completedAt_idx" ON "OrderHistory"("merchantStoreId", "completedAt");
CREATE INDEX "OrderHistory_userId_completedAt_idx" ON "OrderHistory"("userId", "completedAt");
CREATE INDEX "OrderHistory_orderDate_idx" ON "OrderHistory"("orderDate");
CREATE INDEX "OrderHistory_status_idx" ON "OrderHistory"("status");

-- Add foreign key constraint
ALTER TABLE "OrderHistory" ADD CONSTRAINT "OrderHistory_merchantStoreId_fkey" FOREIGN KEY ("merchantStoreId") REFERENCES "MerchantStore"("id") ON DELETE CASCADE ON UPDATE CASCADE;
