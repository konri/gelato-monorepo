-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('CLIENT', 'COURIER');

-- AlterTable: add accountType (default CLIENT for all existing rows)
ALTER TABLE "User" ADD COLUMN "accountType" "AccountType" NOT NULL DEFAULT 'CLIENT';

-- Backfill: existing courier accounts become COURIER before we scope uniqueness
UPDATE "User"
SET "accountType" = 'COURIER'
WHERE "registrationSource" = 'MOBILE_COURIER'
   OR 'COURIER' = ANY("roles");

-- Drop the old global unique indexes
DROP INDEX "User_email_key";
DROP INDEX "User_phone_key";
DROP INDEX "User_googleId_key";
DROP INDEX "User_appleId_key";

-- Add per-account-type composite unique indexes
CREATE UNIQUE INDEX "User_email_accountType_key" ON "User"("email", "accountType");
CREATE UNIQUE INDEX "User_phone_accountType_key" ON "User"("phone", "accountType");
CREATE UNIQUE INDEX "User_googleId_accountType_key" ON "User"("googleId", "accountType");
CREATE UNIQUE INDEX "User_appleId_accountType_key" ON "User"("appleId", "accountType");
