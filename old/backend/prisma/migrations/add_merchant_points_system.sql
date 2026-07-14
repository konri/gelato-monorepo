-- Add merchant-specific points system
-- This migration adds merchant-specific points balance and enhanced coupon tracking

-- Add merchant-specific points balance
CREATE TABLE "UserMerchantPointBalance" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "totalPoints" INTEGER NOT NULL DEFAULT 0,
    "availablePoints" INTEGER NOT NULL DEFAULT 0,
    "lockedPoints" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserMerchantPointBalance_pkey" PRIMARY KEY ("id")
);

-- Add merchant-specific point transactions
CREATE TABLE "MerchantPointTransaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "type" "TransactionType" NOT NULL,
    "amount" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "referenceId" TEXT,
    "referenceType" TEXT,
    "balanceBefore" INTEGER NOT NULL,
    "balanceAfter" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MerchantPointTransaction_pkey" PRIMARY KEY ("id")
);

-- Add coupon usage tracking
CREATE TABLE "CouponUsage" (
    "id" TEXT NOT NULL,
    "couponId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "usedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "remainingUses" INTEGER,
    "metadata" JSONB,

    CONSTRAINT "CouponUsage_pkey" PRIMARY KEY ("id")
);

-- Add indexes
CREATE UNIQUE INDEX "UserMerchantPointBalance_userId_merchantId_key" ON "UserMerchantPointBalance"("userId", "merchantId");
CREATE INDEX "MerchantPointTransaction_userId_idx" ON "MerchantPointTransaction"("userId");
CREATE INDEX "MerchantPointTransaction_merchantId_idx" ON "MerchantPointTransaction"("merchantId");
CREATE INDEX "CouponUsage_couponId_idx" ON "CouponUsage"("couponId");
CREATE INDEX "CouponUsage_userId_idx" ON "CouponUsage"("userId");

-- Add foreign key constraints
ALTER TABLE "UserMerchantPointBalance" ADD CONSTRAINT "UserMerchantPointBalance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserMerchantPointBalance" ADD CONSTRAINT "UserMerchantPointBalance_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MerchantPointTransaction" ADD CONSTRAINT "MerchantPointTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MerchantPointTransaction" ADD CONSTRAINT "MerchantPointTransaction_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CouponUsage" ADD CONSTRAINT "CouponUsage_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "Coupon"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CouponUsage" ADD CONSTRAINT "CouponUsage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add new fields to existing Coupon table
ALTER TABLE "Coupon" ADD COLUMN "currentUses" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Coupon" ADD COLUMN "usesPerUserLimit" INTEGER;
ALTER TABLE "Coupon" ADD COLUMN "globalUsageLimit" INTEGER;
ALTER TABLE "Coupon" ADD COLUMN "isStackable" BOOLEAN NOT NULL DEFAULT false;