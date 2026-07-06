-- CreateEnum
CREATE TYPE "RewardType" AS ENUM ('DISCOUNT_PERCENT', 'DISCOUNT_AMOUNT', 'FREE_SERVICE');

-- AlterTable
ALTER TABLE "LoyaltyStampCardTemplate" ADD COLUMN     "resetStampsOnMilestoneClaim" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "rewardDiscountAmount" DOUBLE PRECISION,
ADD COLUMN     "rewardDiscountPercent" DOUBLE PRECISION,
ADD COLUMN     "rewardImageUrl" TEXT,
ADD COLUMN     "rewardType" "RewardType" NOT NULL DEFAULT 'FREE_SERVICE';

-- AlterTable
ALTER TABLE "StampMilestone" ADD COLUMN     "imageUrl" TEXT;

-- CreateTable
CREATE TABLE "ClaimedMilestone" (
    "id" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "milestoneId" TEXT NOT NULL,
    "qrCode" TEXT NOT NULL,
    "isRedeemed" BOOLEAN NOT NULL DEFAULT false,
    "redeemedAt" TIMESTAMP(3),
    "claimedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClaimedMilestone_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ClaimedMilestone_qrCode_key" ON "ClaimedMilestone"("qrCode");

-- CreateIndex
CREATE INDEX "ClaimedMilestone_qrCode_idx" ON "ClaimedMilestone"("qrCode");

-- CreateIndex
CREATE UNIQUE INDEX "ClaimedMilestone_cardId_milestoneId_key" ON "ClaimedMilestone"("cardId", "milestoneId");

-- AddForeignKey
ALTER TABLE "ClaimedMilestone" ADD CONSTRAINT "ClaimedMilestone_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "LoyaltyStampCard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClaimedMilestone" ADD CONSTRAINT "ClaimedMilestone_milestoneId_fkey" FOREIGN KEY ("milestoneId") REFERENCES "StampMilestone"("id") ON DELETE CASCADE ON UPDATE CASCADE;
