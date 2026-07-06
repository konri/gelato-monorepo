-- AlterTable
ALTER TABLE "Merchant" ADD COLUMN     "rewardProximityThreshold" INTEGER NOT NULL DEFAULT 50,
ADD COLUMN     "stampProximityThreshold" INTEGER NOT NULL DEFAULT 2;
