-- AlterTable
ALTER TABLE "StampTransaction" ADD COLUMN "merchantStoreId" TEXT;

-- AlterTable
ALTER TABLE "MerchantPointTransaction" ADD COLUMN "merchantStoreId" TEXT;

-- AlterTable
ALTER TABLE "CouponUsage" ADD COLUMN "merchantStoreId" TEXT;

-- AlterTable
ALTER TABLE "StreakVisit" ADD COLUMN "merchantStoreId" TEXT;

-- CreateIndex
CREATE INDEX "StampTransaction_merchantStoreId_idx" ON "StampTransaction"("merchantStoreId");

-- CreateIndex
CREATE INDEX "MerchantPointTransaction_merchantStoreId_idx" ON "MerchantPointTransaction"("merchantStoreId");

-- CreateIndex
CREATE INDEX "CouponUsage_merchantStoreId_idx" ON "CouponUsage"("merchantStoreId");

-- CreateIndex
CREATE INDEX "StreakVisit_merchantStoreId_idx" ON "StreakVisit"("merchantStoreId");

-- AddForeignKey
ALTER TABLE "StampTransaction" ADD CONSTRAINT "StampTransaction_merchantStoreId_fkey" FOREIGN KEY ("merchantStoreId") REFERENCES "MerchantStore"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MerchantPointTransaction" ADD CONSTRAINT "MerchantPointTransaction_merchantStoreId_fkey" FOREIGN KEY ("merchantStoreId") REFERENCES "MerchantStore"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CouponUsage" ADD CONSTRAINT "CouponUsage_merchantStoreId_fkey" FOREIGN KEY ("merchantStoreId") REFERENCES "MerchantStore"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StreakVisit" ADD CONSTRAINT "StreakVisit_merchantStoreId_fkey" FOREIGN KEY ("merchantStoreId") REFERENCES "MerchantStore"("id") ON DELETE SET NULL ON UPDATE CASCADE;
