/*
  Warnings:

  - You are about to drop the column `qrCode` on the `ClaimedMilestone` table. All the data in the column will be lost.
  - You are about to drop the column `rewardClaimed` on the `LoyaltyStampCard` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "ClaimedMilestone_cardId_milestoneId_key";

-- DropIndex
DROP INDEX "ClaimedMilestone_qrCode_idx";

-- DropIndex
DROP INDEX "ClaimedMilestone_qrCode_key";

-- AlterTable
ALTER TABLE "ClaimedMilestone" DROP COLUMN "qrCode",
ALTER COLUMN "milestoneId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "LoyaltyStampCard" DROP COLUMN "rewardClaimed";
