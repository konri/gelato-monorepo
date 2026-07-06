-- Dodanie tabeli dla voucherów punktowych
CREATE TABLE "PointVoucher" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "voucherType" TEXT NOT NULL DEFAULT 'SINGLE_SERVICE',
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

-- Dodanie tabeli dla użytych voucherów punktowych
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

-- Dodanie indeksów
CREATE UNIQUE INDEX "PointVoucher_code_key" ON "PointVoucher"("code");
CREATE UNIQUE INDEX "UserPointVoucher_qrCode_key" ON "UserPointVoucher"("qrCode");
CREATE INDEX "UserPointVoucher_userId_idx" ON "UserPointVoucher"("userId");
CREATE INDEX "UserPointVoucher_pointVoucherId_idx" ON "UserPointVoucher"("pointVoucherId");

-- Dodanie kluczy obcych
ALTER TABLE "UserPointVoucher" ADD CONSTRAINT "UserPointVoucher_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserPointVoucher" ADD CONSTRAINT "UserPointVoucher_pointVoucherId_fkey" FOREIGN KEY ("pointVoucherId") REFERENCES "PointVoucher"("id") ON DELETE CASCADE ON UPDATE CASCADE;