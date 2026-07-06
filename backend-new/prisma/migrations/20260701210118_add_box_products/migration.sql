-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "boxTasteIds" TEXT[];

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "isBox" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "maxTastes" INTEGER,
ADD COLUMN     "weightGrams" INTEGER;
