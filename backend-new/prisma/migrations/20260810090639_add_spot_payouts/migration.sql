-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "spotPayoutId" TEXT;

-- CreateTable
CREATE TABLE "SpotPayout" (
    "id" TEXT NOT NULL,
    "spotId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "orderCount" INTEGER NOT NULL,
    "note" TEXT,
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidById" TEXT,

    CONSTRAINT "SpotPayout_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SpotPayout_spotId_paidAt_idx" ON "SpotPayout"("spotId", "paidAt");

-- CreateIndex
CREATE INDEX "Order_spotPayoutId_idx" ON "Order"("spotPayoutId");

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_spotPayoutId_fkey" FOREIGN KEY ("spotPayoutId") REFERENCES "SpotPayout"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpotPayout" ADD CONSTRAINT "SpotPayout_spotId_fkey" FOREIGN KEY ("spotId") REFERENCES "Spot"("id") ON DELETE CASCADE ON UPDATE CASCADE;
