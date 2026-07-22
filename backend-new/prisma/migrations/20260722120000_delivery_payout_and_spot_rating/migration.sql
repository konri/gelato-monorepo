-- Courier payout per delivery (what the spot pays the courier).
ALTER TABLE "Spot" ADD COLUMN "courierPayout" DOUBLE PRECISION NOT NULL DEFAULT 0;
-- Cached spot review aggregates.
ALTER TABLE "Spot" ADD COLUMN "averageRating" DOUBLE PRECISION;
ALTER TABLE "Spot" ADD COLUMN "reviewCount" INTEGER NOT NULL DEFAULT 0;
-- Snapshot of courier payout on each order (paid even when delivery is free).
ALTER TABLE "Order" ADD COLUMN "courierPayout" DOUBLE PRECISION NOT NULL DEFAULT 0;
