-- CreateTable
CREATE TABLE "MerchantPointsProgram" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "amountSpent" DOUBLE PRECISION NOT NULL,
    "pointsAwarded" INTEGER NOT NULL,
    "cardMessage" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MerchantPointsProgram_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MerchantPointsProgram_merchantId_key" ON "MerchantPointsProgram"("merchantId");

-- AddForeignKey
ALTER TABLE "MerchantPointsProgram" ADD CONSTRAINT "MerchantPointsProgram_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
