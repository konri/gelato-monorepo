-- AlterTable
ALTER TABLE "MerchantVoucher" ADD COLUMN     "isPromoted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "priority" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "storeId" TEXT;

-- AddForeignKey
ALTER TABLE "MerchantVoucher" ADD CONSTRAINT "MerchantVoucher_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "MerchantStore"("id") ON DELETE SET NULL ON UPDATE CASCADE;
