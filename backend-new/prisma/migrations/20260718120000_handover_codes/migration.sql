-- Handover confirmation codes: spot→courier pickup code + client→courier
-- 4-digit delivery PIN, so status transitions require an in-person confirmation.
ALTER TABLE "Order" ADD COLUMN "pickupCode" TEXT;
ALTER TABLE "Order" ADD COLUMN "deliveryPin" TEXT;
