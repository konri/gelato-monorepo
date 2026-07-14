-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PREPARING', 'READY', 'PICKED_UP');

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'ORDER_READY';

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "merchantStoreId" TEXT NOT NULL,
    "orderNumber" INTEGER NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PREPARING',
    "userId" TEXT,
    "sessionToken" TEXT,
    "orderDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderCounter" (
    "id" TEXT NOT NULL,
    "merchantStoreId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "lastNumber" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrderCounter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebOrderSession" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "merchantStoreId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WebOrderSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Order_merchantStoreId_createdAt_idx" ON "Order"("merchantStoreId", "createdAt");

-- CreateIndex
CREATE INDEX "Order_merchantStoreId_status_idx" ON "Order"("merchantStoreId", "status");

-- CreateIndex
CREATE INDEX "Order_sessionToken_idx" ON "Order"("sessionToken");

-- CreateIndex
CREATE INDEX "Order_userId_idx" ON "Order"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "OrderCounter_merchantStoreId_date_key" ON "OrderCounter"("merchantStoreId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "WebOrderSession_sessionToken_key" ON "WebOrderSession"("sessionToken");

-- CreateIndex
CREATE INDEX "WebOrderSession_sessionToken_idx" ON "WebOrderSession"("sessionToken");

-- CreateIndex
CREATE INDEX "WebOrderSession_expiresAt_idx" ON "WebOrderSession"("expiresAt");

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_merchantStoreId_fkey" FOREIGN KEY ("merchantStoreId") REFERENCES "MerchantStore"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderCounter" ADD CONSTRAINT "OrderCounter_merchantStoreId_fkey" FOREIGN KEY ("merchantStoreId") REFERENCES "MerchantStore"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebOrderSession" ADD CONSTRAINT "WebOrderSession_merchantStoreId_fkey" FOREIGN KEY ("merchantStoreId") REFERENCES "MerchantStore"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "UniqueCooperatorCompanyStoreAccess" RENAME TO "CooperatorCompanyStoreAccess_cooperatorCompanyId_merchantSt_key";

-- RenameIndex
ALTER INDEX "CooperatorInvitation_companyOwnerId_revokedAt_acceptedAt_expire" RENAME TO "CooperatorInvitation_companyOwnerId_revokedAt_acceptedAt_ex_idx";

-- RenameIndex
ALTER INDEX "UniqueInvitationStoreAccess" RENAME TO "CooperatorInvitationStoreAccess_invitationId_merchantStoreI_key";

-- RenameIndex
ALTER INDEX "UniqueCouponStoreOverride" RENAME TO "CouponStoreOverride_couponId_merchantStoreId_key";

-- RenameIndex
ALTER INDEX "UniqueRewardStoreOverride" RENAME TO "RewardStoreOverride_rewardId_merchantStoreId_key";

-- RenameIndex
ALTER INDEX "UniqueStreakProgramStoreOverride" RENAME TO "StreakProgramStoreOverride_streakProgramId_merchantStoreId_key";
