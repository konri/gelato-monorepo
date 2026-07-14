-- CreateEnum
CREATE TYPE "RegistrationSource" AS ENUM ('WEB_MERCHANT', 'WEB_CLIENT', 'MOBILE_CLIENT');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "registrationSource" "RegistrationSource";
