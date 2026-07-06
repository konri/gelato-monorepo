-- Track which spot staff claimed an order to prepare it (first-to-claim).
ALTER TABLE "Order" ADD COLUMN "preparedById" TEXT;
ALTER TABLE "Order" ADD COLUMN "preparedByName" TEXT;
ALTER TABLE "Order" ADD COLUMN "claimedAt" TIMESTAMP(3);
