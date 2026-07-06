/*
  Warnings:

  - A unique constraint covering the columns `[code]` on the table `EmailVerification` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `code` to the `EmailVerification` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "EmailVerification" ADD COLUMN     "code" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "EmailVerification_code_key" ON "EmailVerification"("code");
