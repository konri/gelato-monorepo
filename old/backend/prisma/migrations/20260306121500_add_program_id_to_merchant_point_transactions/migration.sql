-- AlterTable
ALTER TABLE "MerchantPointTransaction" ADD COLUMN "merchantPointsProgramId" TEXT;

-- Backfill for transactions where a program already exists
UPDATE "MerchantPointTransaction" mpt
SET "merchantPointsProgramId" = mpp."id"
FROM "MerchantPointsProgram" mpp
WHERE mpt."merchantId" = mpp."merchantId"
  AND mpt."merchantPointsProgramId" IS NULL;

-- CreateIndex
CREATE INDEX "MerchantPointTransaction_merchantPointsProgramId_idx" ON "MerchantPointTransaction"("merchantPointsProgramId");

-- AddForeignKey
ALTER TABLE "MerchantPointTransaction" ADD CONSTRAINT "MerchantPointTransaction_merchantPointsProgramId_fkey" FOREIGN KEY ("merchantPointsProgramId") REFERENCES "MerchantPointsProgram"("id") ON DELETE SET NULL ON UPDATE CASCADE;
