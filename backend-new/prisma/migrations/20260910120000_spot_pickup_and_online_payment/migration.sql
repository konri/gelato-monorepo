-- Spot-level pickup (collect at venue) and in-app / pay-by-phone payment.
-- pickupEnabled defaults off so existing spots stay courier-only until opted in.
-- onlinePaymentEnabled defaults on; spots can turn it off for cash-only pickup.

ALTER TABLE "Spot" ADD COLUMN "pickupEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Spot" ADD COLUMN "onlinePaymentEnabled" BOOLEAN NOT NULL DEFAULT true;
