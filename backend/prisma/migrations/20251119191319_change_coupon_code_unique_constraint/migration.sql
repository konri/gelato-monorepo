-- Change coupon code unique constraint from global to per-merchant
-- Drop existing unique constraint on code
DROP INDEX IF EXISTS "Coupon_code_key";

-- Add new unique constraint on (code, merchantId)
CREATE UNIQUE INDEX "Coupon_code_merchantId_key" ON "Coupon" (code, "merchantId");