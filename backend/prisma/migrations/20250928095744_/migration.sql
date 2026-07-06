-- AlterTable
ALTER TABLE "LoyaltyStampCard" ADD COLUMN     "templateId" TEXT;

-- CreateTable
CREATE TABLE "LoyaltyStampCardTemplate" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "stampsRequired" INTEGER NOT NULL DEFAULT 10,
    "rewardTitle" TEXT,
    "rewardDescription" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "validFrom" TIMESTAMP(3),
    "validUntil" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoyaltyStampCardTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LoyaltyStampCardTemplate_merchantId_title_key" ON "LoyaltyStampCardTemplate"("merchantId", "title");

-- AddForeignKey
ALTER TABLE "LoyaltyStampCardTemplate" ADD CONSTRAINT "LoyaltyStampCardTemplate_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoyaltyStampCard" ADD CONSTRAINT "LoyaltyStampCard_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "LoyaltyStampCardTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
