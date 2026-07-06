-- AlterTable
ALTER TABLE "Coupon" ADD COLUMN     "shortDescription" TEXT,
ADD COLUMN     "termsAndConditions" TEXT;

-- AlterTable
ALTER TABLE "LoyaltyStampCardTemplate" ADD COLUMN     "awardType" TEXT,
ADD COLUMN     "minimumAmount" DOUBLE PRECISION;
