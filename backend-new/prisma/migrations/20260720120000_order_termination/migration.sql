-- Spot can terminate an order (out of stock / closing): a refund is issued and
-- the customer keeps any loyalty points, with a distinct TERMINATED status.

-- New enum value (Postgres requires ALTER TYPE ... ADD VALUE, non-transactional).
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'TERMINATED';

-- Termination bookkeeping on the order.
ALTER TABLE "Order" ADD COLUMN "terminatedAt" TIMESTAMP(3);
ALTER TABLE "Order" ADD COLUMN "terminationReason" TEXT;
ALTER TABLE "Order" ADD COLUMN "refundedAt" TIMESTAMP(3);

-- Track which courier reported an incident so they can't re-accept the order.
ALTER TABLE "Order" ADD COLUMN "incidentReportedBy" TEXT;
