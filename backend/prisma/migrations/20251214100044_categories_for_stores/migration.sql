-- AlterTable
ALTER TABLE "MerchantStore" ADD COLUMN     "categoryId" TEXT;

-- AddForeignKey
ALTER TABLE "MerchantStore" ADD CONSTRAINT "MerchantStore_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
