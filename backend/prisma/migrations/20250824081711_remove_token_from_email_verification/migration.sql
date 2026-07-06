/*
  Warnings:

  - You are about to drop the column `token` on the `EmailVerification` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "EmailVerification_token_key";

-- AlterTable
ALTER TABLE "EmailVerification" DROP COLUMN "token";
