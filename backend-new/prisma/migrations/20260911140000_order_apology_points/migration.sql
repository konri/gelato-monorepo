-- Extra loyalty points credited as an apology when the spot cancels an order.
ALTER TABLE "Order" ADD COLUMN "apologyPoints" INTEGER;
