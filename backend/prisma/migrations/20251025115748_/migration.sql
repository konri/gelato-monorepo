/*
  Warnings:

  - The values [WEB_CLIENT] on the enum `RegistrationSource` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "RegistrationSource_new" AS ENUM ('WEB_MERCHANT', 'MOBILE_CLIENT');
ALTER TABLE "User" ALTER COLUMN "registrationSource" TYPE "RegistrationSource_new" USING ("registrationSource"::text::"RegistrationSource_new");
ALTER TYPE "RegistrationSource" RENAME TO "RegistrationSource_old";
ALTER TYPE "RegistrationSource_new" RENAME TO "RegistrationSource";
DROP TYPE "RegistrationSource_old";
COMMIT;
