-- AlterTable
ALTER TABLE "Coupon" ADD COLUMN     "displayType" "VoucherDisplayType" NOT NULL DEFAULT 'STANDARD',
ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "priority" INTEGER NOT NULL DEFAULT 0;
