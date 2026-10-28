-- AlterEnum
ALTER TYPE "ProductType" ADD VALUE 'ICE_CREAM_BOX';
ALTER TYPE "ProductType" ADD VALUE 'SANDWICH';
ALTER TYPE "ProductType" ADD VALUE 'BREAD';
ALTER TYPE "ProductType" ADD VALUE 'PASTRY';

-- CreateTable
CREATE TABLE "MenuCategory" (
    "id" TEXT NOT NULL,
    "spotId" TEXT NOT NULL,
    "nameLocal" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MenuCategory_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "Product" ADD COLUMN "categoryId" TEXT;

-- CreateIndex
CREATE INDEX "MenuCategory_spotId_idx" ON "MenuCategory"("spotId");

-- CreateIndex
CREATE INDEX "Product_categoryId_idx" ON "Product"("categoryId");

-- AddForeignKey
ALTER TABLE "MenuCategory" ADD CONSTRAINT "MenuCategory_spotId_fkey" FOREIGN KEY ("spotId") REFERENCES "Spot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "MenuCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
