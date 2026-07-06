-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "phoneNumber" TEXT;

-- AlterTable
ALTER TABLE "OrderHistory" ADD COLUMN     "phoneNumber" TEXT;

-- CreateIndex
CREATE INDEX "Order_pickupCode_idx" ON "Order"("pickupCode");

-- CreateIndex
CREATE INDEX "Order_phoneNumber_idx" ON "Order"("phoneNumber");

-- CreateIndex
CREATE INDEX "OrderHistory_phoneNumber_idx" ON "OrderHistory"("phoneNumber");
