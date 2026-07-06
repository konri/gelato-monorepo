/*
  Warnings:

  - A unique constraint covering the columns `[phone]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- Clean up empty strings first
UPDATE "User" SET phone = NULL WHERE phone = '';

-- CreateIndex - Partial unique index (only for non-NULL, non-empty phones)
CREATE UNIQUE INDEX "User_phone_key" ON "User"(phone) WHERE phone IS NOT NULL AND phone != '';
