-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "statusHistory" JSONB NOT NULL DEFAULT '[]';
