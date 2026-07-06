/*
  Warnings:

  - A unique constraint covering the columns `[referredUserId]` on the table `Referral` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Referral_referredUserId_key" ON "Referral"("referredUserId");
