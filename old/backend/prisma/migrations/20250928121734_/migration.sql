/*
  Warnings:

  - A unique constraint covering the columns `[merchantId]` on the table `MerchantRequest` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "MerchantRequest" ADD COLUMN     "merchantId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "MerchantRequest_merchantId_key" ON "MerchantRequest"("merchantId");

-- AddForeignKey
ALTER TABLE "MerchantRequest" ADD CONSTRAINT "MerchantRequest_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
