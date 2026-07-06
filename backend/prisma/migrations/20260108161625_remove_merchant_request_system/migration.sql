/*
  Warnings:

  - You are about to drop the `MerchantRequest` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[companyId]` on the table `Merchant` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "MerchantRequest" DROP CONSTRAINT "MerchantRequest_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "MerchantRequest" DROP CONSTRAINT "MerchantRequest_companyId_fkey";

-- DropForeignKey
ALTER TABLE "MerchantRequest" DROP CONSTRAINT "MerchantRequest_merchantId_fkey";

-- AlterTable
ALTER TABLE "Merchant" ADD COLUMN     "companyId" TEXT,
ADD COLUMN     "isVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "verifiedAt" TIMESTAMP(3),
ADD COLUMN     "verifiedBy" TEXT;

-- DropTable
DROP TABLE "MerchantRequest";

-- DropEnum
DROP TYPE "MerchantRequestStatus";

-- CreateIndex
CREATE UNIQUE INDEX "Merchant_companyId_key" ON "Merchant"("companyId");

-- AddForeignKey
ALTER TABLE "Merchant" ADD CONSTRAINT "Merchant_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;
