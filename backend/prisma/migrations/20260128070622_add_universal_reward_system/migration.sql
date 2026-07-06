-- CreateEnum
CREATE TYPE "RewardSourceType" AS ENUM ('STAMP_CARD', 'POINTS', 'CASH', 'SUBSCRIPTION', 'REFERRAL', 'ACTIVITY');

-- CreateEnum
CREATE TYPE "RewardValueType" AS ENUM ('FREE_SERVICE', 'DISCOUNT_PERCENT', 'DISCOUNT_AMOUNT', 'PRODUCT', 'POINTS', 'CASH_VOUCHER');

-- AlterTable
ALTER TABLE "Coupon" ADD COLUMN     "rewardId" TEXT;

-- AlterTable
ALTER TABLE "LoyaltyStampCardTemplate" ADD COLUMN     "rewardId" TEXT;

-- AlterTable
ALTER TABLE "StampMilestone" ADD COLUMN     "rewardId" TEXT;

-- CreateTable
CREATE TABLE "Reward" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "sourceType" "RewardSourceType" NOT NULL,
    "valueType" "RewardValueType" NOT NULL,
    "discountPercent" DOUBLE PRECISION,
    "discountAmount" DOUBLE PRECISION,
    "pointsValue" INTEGER,
    "cashValue" DOUBLE PRECISION,
    "productName" TEXT,
    "maxUsesPerUser" INTEGER,
    "totalQuantity" INTEGER,
    "currentUses" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "validFrom" TIMESTAMP(3),
    "validUntil" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reward_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Reward" ADD CONSTRAINT "Reward_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoyaltyStampCardTemplate" ADD CONSTRAINT "LoyaltyStampCardTemplate_rewardId_fkey" FOREIGN KEY ("rewardId") REFERENCES "Reward"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StampMilestone" ADD CONSTRAINT "StampMilestone_rewardId_fkey" FOREIGN KEY ("rewardId") REFERENCES "Reward"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Coupon" ADD CONSTRAINT "Coupon_rewardId_fkey" FOREIGN KEY ("rewardId") REFERENCES "Reward"("id") ON DELETE SET NULL ON UPDATE CASCADE;
