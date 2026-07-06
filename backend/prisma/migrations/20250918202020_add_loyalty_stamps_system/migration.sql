-- CreateEnum
CREATE TYPE "StampTransactionType" AS ENUM ('EARNED', 'USED', 'EXPIRED', 'REFUNDED');

-- CreateTable
CREATE TABLE "LoyaltyStampCard" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "stampsRequired" INTEGER NOT NULL DEFAULT 10,
    "stampsCollected" INTEGER NOT NULL DEFAULT 0,
    "stampsUsed" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "validUntil" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoyaltyStampCard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoyaltyStamp" (
    "id" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "isUsed" BOOLEAN NOT NULL DEFAULT false,
    "usedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoyaltyStamp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StampTransaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "type" "StampTransactionType" NOT NULL,
    "amount" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "referenceId" TEXT,
    "referenceType" TEXT,
    "balanceBefore" INTEGER NOT NULL,
    "balanceAfter" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StampTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StampAuditLog" (
    "id" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "stampsBefore" INTEGER NOT NULL,
    "stampsAfter" INTEGER NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StampAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LoyaltyStampCard_userId_merchantId_key" ON "LoyaltyStampCard"("userId", "merchantId");

-- CreateIndex
CREATE INDEX "StampAuditLog_cardId_idx" ON "StampAuditLog"("cardId");

-- CreateIndex
CREATE INDEX "StampAuditLog_action_idx" ON "StampAuditLog"("action");

-- AddForeignKey
ALTER TABLE "LoyaltyStampCard" ADD CONSTRAINT "LoyaltyStampCard_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoyaltyStampCard" ADD CONSTRAINT "LoyaltyStampCard_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoyaltyStamp" ADD CONSTRAINT "LoyaltyStamp_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "LoyaltyStampCard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StampTransaction" ADD CONSTRAINT "StampTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StampTransaction" ADD CONSTRAINT "StampTransaction_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "LoyaltyStampCard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StampAuditLog" ADD CONSTRAINT "StampAuditLog_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "LoyaltyStampCard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- =====================================================
-- LOYALTY STAMPS CONSTRAINTS & FUNCTIONS
-- =====================================================

-- 1. Database Constraints dla integralności danych
ALTER TABLE "LoyaltyStampCard" 
ADD CONSTRAINT check_stamps_consistency 
CHECK ("stampsCollected" >= 0 AND "stampsUsed" >= 0 AND "stampsCollected" >= "stampsUsed");

ALTER TABLE "LoyaltyStampCard"
ADD CONSTRAINT check_stamps_required_positive
CHECK ("stampsRequired" > 0);

-- 2. Funkcja walidacji integralności
CREATE OR REPLACE FUNCTION validate_stamp_card_integrity(card_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    card_balance INTEGER;
    transaction_sum INTEGER;
    physical_stamps INTEGER;
BEGIN
    SELECT "stampsCollected" INTO card_balance
    FROM "LoyaltyStampCard" 
    WHERE id = card_id::TEXT;
    
    SELECT COALESCE(SUM(amount), 0) INTO transaction_sum
    FROM "StampTransaction" 
    WHERE "cardId" = card_id::TEXT;
    
    SELECT COUNT(*) INTO physical_stamps
    FROM "LoyaltyStamp" 
    WHERE "cardId" = card_id::TEXT AND "isUsed" = false;
    
    RETURN (card_balance = transaction_sum AND card_balance = physical_stamps);
END;
$$ LANGUAGE plpgsql;

-- 3. Funkcja naprawy niezgodności
CREATE OR REPLACE FUNCTION fix_stamp_card_discrepancy(card_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    correct_balance INTEGER;
BEGIN
    SELECT COALESCE(SUM(amount), 0) INTO correct_balance
    FROM "StampTransaction" 
    WHERE "cardId" = card_id::TEXT;
    
    UPDATE "LoyaltyStampCard" 
    SET "stampsCollected" = correct_balance,
        "updatedAt" = NOW()
    WHERE id = card_id::TEXT;
    
    INSERT INTO "StampAuditLog" (
        id, "cardId", "userId", "merchantId",
        action, "stampsBefore", "stampsAfter", metadata, "createdAt"
    )
    SELECT 
        gen_random_uuid()::TEXT,
        lsc.id,
        lsc."userId",
        lsc."merchantId",
        'BALANCE_CORRECTED',
        lsc."stampsCollected",
        correct_balance,
        json_build_object(
            'correctedBy', 'SYSTEM',
            'correctionReason', 'INTEGRITY_CHECK'
        ),
        NOW()
    FROM "LoyaltyStampCard" lsc 
    WHERE lsc.id = card_id::TEXT;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- 4. Funkcja audit triggers
CREATE OR REPLACE FUNCTION audit_loyalty_stamp_card_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO "StampAuditLog" (
            id, "cardId", "userId", "merchantId", 
            action, "stampsBefore", "stampsAfter", metadata, "createdAt"
        )
        VALUES (
            gen_random_uuid()::TEXT,
            NEW.id,
            NEW."userId",
            NEW."merchantId",
            'CARD_CREATED',
            0,
            NEW."stampsCollected",
            json_build_object(
                'stampsRequired', NEW."stampsRequired"
            ),
            NOW()
        );
        RETURN NEW;
        
    ELSIF TG_OP = 'UPDATE' AND OLD."stampsCollected" != NEW."stampsCollected" THEN
        INSERT INTO "StampAuditLog" (
            id, "cardId", "userId", "merchantId",
            action, "stampsBefore", "stampsAfter", metadata, "createdAt"
        )
        VALUES (
            gen_random_uuid()::TEXT,
            NEW.id,
            NEW."userId", 
            NEW."merchantId",
            CASE 
                WHEN NEW."stampsCollected" > OLD."stampsCollected" THEN 'STAMP_EARNED'
                WHEN NEW."stampsCollected" < OLD."stampsCollected" THEN 'STAMP_USED'
                ELSE 'STAMP_UPDATED'
            END,
            OLD."stampsCollected",
            NEW."stampsCollected",
            json_build_object(
                'difference', NEW."stampsCollected" - OLD."stampsCollected"
            ),
            NOW()
        );
        RETURN NEW;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Przypisz triggery
CREATE TRIGGER loyalty_stamp_card_audit_trigger
    AFTER INSERT OR UPDATE ON "LoyaltyStampCard"
    FOR EACH ROW 
    EXECUTE FUNCTION audit_loyalty_stamp_card_changes();
