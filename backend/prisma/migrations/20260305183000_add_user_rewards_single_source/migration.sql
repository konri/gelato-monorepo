-- CreateEnum
CREATE TYPE "UserRewardSourceType" AS ENUM ('STAMP_MAIN', 'STAMP_MILESTONE', 'STREAK', 'COUPON', 'POINT_VOUCHER', 'MERCHANT_VOUCHER');

-- CreateEnum
CREATE TYPE "UserRewardStatus" AS ENUM ('AVAILABLE', 'CLAIMED', 'REDEEMED', 'EXPIRED', 'CANCELLED');

-- CreateTable
CREATE TABLE "UserReward" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "merchantId" TEXT,
    "rewardId" TEXT,
    "sourceType" "UserRewardSourceType" NOT NULL,
    "sourceEntityId" TEXT NOT NULL,
    "sourceSubEntityId" TEXT NOT NULL DEFAULT '',
    "status" "UserRewardStatus" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "availableAt" TIMESTAMP(3),
    "claimedAt" TIMESTAMP(3),
    "redeemedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "pointsCost" INTEGER,
    "qrCode" TEXT,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserReward_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UniqueUserRewardSource" ON "UserReward"("userId", "sourceType", "sourceEntityId", "sourceSubEntityId");

-- CreateIndex
CREATE INDEX "UserReward_userId_status_merchantId_createdAt_idx" ON "UserReward"("userId", "status", "merchantId", "createdAt");

-- CreateIndex
CREATE INDEX "UserReward_merchantId_status_createdAt_idx" ON "UserReward"("merchantId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "UserReward_rewardId_idx" ON "UserReward"("rewardId");
