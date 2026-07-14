-- DropIndex
DROP INDEX "LoyaltyStampCard_userId_merchantId_key";

-- AlterTable
ALTER TABLE "LoyaltyStampCard" ADD COLUMN     "rewardClaimed" TEXT,
ADD COLUMN     "usedAt" TIMESTAMP(3);
