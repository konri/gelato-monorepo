-- Pickup / collect-at-spot fulfillment with pay-now (Stripe) or pay-at-spot (cash).

-- New fulfillment type enum.
CREATE TYPE "FulfillmentType" AS ENUM ('DELIVERY', 'PICKUP');

-- New terminal status for a pickup order collected at the spot.
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'COLLECTED';

-- Order columns.
ALTER TABLE "Order" ADD COLUMN "fulfillmentType" "FulfillmentType" NOT NULL DEFAULT 'DELIVERY';
ALTER TABLE "Order" ADD COLUMN "pointsAwarded" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Order" ADD COLUMN "collectedAt" TIMESTAMP(3);

-- Delivery address is now optional (pickup orders have none).
ALTER TABLE "Order" ALTER COLUMN "deliveryAddress" DROP NOT NULL;
ALTER TABLE "Order" ALTER COLUMN "deliveryLatitude" DROP NOT NULL;
ALTER TABLE "Order" ALTER COLUMN "deliveryLongitude" DROP NOT NULL;
