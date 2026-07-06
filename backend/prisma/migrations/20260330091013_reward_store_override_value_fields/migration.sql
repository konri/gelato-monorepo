-- AlterTable
ALTER TABLE "RewardStoreOverride" ADD COLUMN     "discountAmount" DOUBLE PRECISION,
ADD COLUMN     "discountPercent" DOUBLE PRECISION,
ADD COLUMN     "maxUsesPerUser" INTEGER,
ADD COLUMN     "pointsValue" INTEGER,
ADD COLUMN     "productName" TEXT,
ADD COLUMN     "totalQuantity" INTEGER,
ADD COLUMN     "validFrom" TIMESTAMP(3),
ADD COLUMN     "validUntil" TIMESTAMP(3),
ADD COLUMN     "valueType" "RewardValueType";
