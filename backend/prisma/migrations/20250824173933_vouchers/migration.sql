-- CreateEnum
CREATE TYPE "VoucherType" AS ENUM ('SINGLE_SERVICE', 'MULTI_USE', 'SERVICE_PACKAGE', 'DISCOUNT_PERCENT', 'CASH_EQUIVALENT');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('EARNED', 'SPENT', 'REFUND', 'BONUS', 'PENALTY');

-- CreateTable
CREATE TABLE "PointVoucher" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "voucherType" "VoucherType" NOT NULL DEFAULT 'SINGLE_SERVICE',
    "pointsCost" INTEGER NOT NULL,
    "maxUses" INTEGER NOT NULL DEFAULT 1,
    "currentUses" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "validFrom" TIMESTAMP(3),
    "validUntil" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PointVoucher_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPointVoucher" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "pointVoucherId" TEXT NOT NULL,
    "qrCode" TEXT NOT NULL,
    "isUsed" BOOLEAN NOT NULL DEFAULT false,
    "usedAt" TIMESTAMP(3),
    "validUntil" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserPointVoucher_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPointBalance" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "totalPoints" INTEGER NOT NULL DEFAULT 0,
    "availablePoints" INTEGER NOT NULL DEFAULT 0,
    "lockedPoints" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserPointBalance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PointTransaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "TransactionType" NOT NULL,
    "amount" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "referenceId" TEXT,
    "referenceType" TEXT,
    "balanceBefore" INTEGER NOT NULL,
    "balanceAfter" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PointTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VoucherHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "voucherType" TEXT NOT NULL,
    "voucherId" TEXT NOT NULL,
    "voucherCode" TEXT NOT NULL,
    "voucherTitle" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "pointsSpent" INTEGER,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VoucherHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PointVoucher_code_key" ON "PointVoucher"("code");

-- CreateIndex
CREATE UNIQUE INDEX "UserPointVoucher_qrCode_key" ON "UserPointVoucher"("qrCode");

-- CreateIndex
CREATE UNIQUE INDEX "UserPointBalance_userId_key" ON "UserPointBalance"("userId");

-- CreateIndex
CREATE INDEX "VoucherHistory_userId_idx" ON "VoucherHistory"("userId");

-- CreateIndex
CREATE INDEX "VoucherHistory_voucherType_idx" ON "VoucherHistory"("voucherType");

-- CreateIndex
CREATE INDEX "VoucherHistory_action_idx" ON "VoucherHistory"("action");

-- AddForeignKey
ALTER TABLE "UserPointVoucher" ADD CONSTRAINT "UserPointVoucher_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPointVoucher" ADD CONSTRAINT "UserPointVoucher_pointVoucherId_fkey" FOREIGN KEY ("pointVoucherId") REFERENCES "PointVoucher"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPointBalance" ADD CONSTRAINT "UserPointBalance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PointTransaction" ADD CONSTRAINT "PointTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
