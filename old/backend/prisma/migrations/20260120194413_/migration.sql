/*
  Warnings:

  - A unique constraint covering the columns `[qrCode]` on the table `UserCoupon` will be added. If there are existing duplicate values, this will fail.
  - The required column `qrCode` was added to the `UserCoupon` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- AlterTable
ALTER TABLE "UserCoupon" ADD COLUMN     "qrCode" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "UserCoupon_qrCode_key" ON "UserCoupon"("qrCode");
