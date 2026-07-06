-- =====================================================
-- VOUCHER AUDIT TRIGGERS MIGRATION
-- Automatyczne tworzenie wpisów w VoucherHistory
-- =====================================================

-- 1. Funkcja dla audytu voucherów punktowych
CREATE OR REPLACE FUNCTION audit_point_voucher_changes()
RETURNS TRIGGER AS $$
BEGIN
    -- INSERT: Automatycznie dodaj wpis PURCHASED przy tworzeniu UserPointVoucher
    IF TG_OP = 'INSERT' THEN
        INSERT INTO "VoucherHistory" (
            id, "userId", "voucherType", "voucherId", 
            "voucherCode", "voucherTitle", action, "pointsSpent", metadata, "createdAt"
        )
        SELECT 
            gen_random_uuid(),
            NEW."userId",
            'POINT_VOUCHER',
            NEW."pointVoucherId",
            pv.code,
            pv.title,
            'PURCHASED',
            pv."pointsCost",
            json_build_object(
                'qrCode', NEW."qrCode", 
                'validUntil', NEW."validUntil"::text
            ),
            NOW()
        FROM "PointVoucher" pv 
        WHERE pv.id = NEW."pointVoucherId";
        
        RETURN NEW;
        
    -- UPDATE: Automatycznie dodaj wpis USED przy oznaczeniu jako wykorzystany
    ELSIF TG_OP = 'UPDATE' AND OLD."isUsed" = false AND NEW."isUsed" = true THEN
        INSERT INTO "VoucherHistory" (
            id, "userId", "voucherType", "voucherId",
            "voucherCode", "voucherTitle", action, "pointsSpent", metadata, "createdAt"
        )
        SELECT 
            gen_random_uuid(),
            NEW."userId",
            'POINT_VOUCHER',
            NEW."pointVoucherId",
            pv.code,
            pv.title,
            'USED',
            0,
            json_build_object(
                'qrCode', NEW."qrCode", 
                'usedAt', COALESCE(NEW."usedAt", NOW())::text
            ),
            NOW()
        FROM "PointVoucher" pv 
        WHERE pv.id = NEW."pointVoucherId";
        
        RETURN NEW;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Przypisz trigger do tabeli UserPointVoucher
DROP TRIGGER IF EXISTS point_voucher_audit_trigger ON "UserPointVoucher";
CREATE TRIGGER point_voucher_audit_trigger
    AFTER INSERT OR UPDATE ON "UserPointVoucher"
    FOR EACH ROW 
    EXECUTE FUNCTION audit_point_voucher_changes();

-- Trigger jest gotowy do użycia!
-- Automatycznie tworzy wpisy w VoucherHistory przy:
-- - INSERT na UserPointVoucher → action: 'PURCHASED'
-- - UPDATE isUsed: false→true → action: 'USED'