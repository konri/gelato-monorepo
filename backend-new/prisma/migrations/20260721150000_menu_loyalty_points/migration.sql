-- Loyalty points earned per unit of a menu item (paid orders).
ALTER TABLE "Taste" ADD COLUMN "loyaltyPoints" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Product" ADD COLUMN "loyaltyPoints" INTEGER NOT NULL DEFAULT 0;
-- Snapshot of points-per-unit at order time (survives later menu edits).
ALTER TABLE "OrderItem" ADD COLUMN "pointsPerUnit" INTEGER NOT NULL DEFAULT 0;
