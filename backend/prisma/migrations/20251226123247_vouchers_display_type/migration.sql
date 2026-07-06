/*
  Warnings:

  - You are about to drop the column `isPromoted` on the `MerchantVoucher` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "VoucherDisplayType" AS ENUM ('HOT', 'PROMOTED', 'STANDARD');

-- AlterTable
ALTER TABLE "MerchantVoucher" DROP COLUMN "isPromoted",
ADD COLUMN     "displayType" "VoucherDisplayType" NOT NULL DEFAULT 'STANDARD';
