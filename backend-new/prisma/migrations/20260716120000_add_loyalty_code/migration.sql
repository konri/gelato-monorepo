-- Short, human-typeable loyalty/account number shown on the client's QR card.
-- Spot staff can scan the QR or type this code to award points.
ALTER TABLE "User" ADD COLUMN "loyaltyCode" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_loyaltyCode_key" ON "User"("loyaltyCode");
