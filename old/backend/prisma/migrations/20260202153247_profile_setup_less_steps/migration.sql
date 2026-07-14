/*
  Warnings:

  - The values [COMPANY_INFO,COMPANY_PHOTO,MERCHANT_INFO,MERCHANT_LOCATION,COMPANY_DETAILS] on the enum `ProfileSetupStep` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ProfileSetupStep_new" AS ENUM ('COMPANY', 'MERCHANT', 'STORE', 'SUBSCRIPTION', 'COMPLETED');
ALTER TABLE "ProfileSetupProgress" ALTER COLUMN "currentStep" DROP DEFAULT;
ALTER TABLE "ProfileSetupProgress" ALTER COLUMN "currentStep" TYPE "ProfileSetupStep_new" USING ("currentStep"::text::"ProfileSetupStep_new");
ALTER TABLE "ProfileSetupProgress" ALTER COLUMN "completedSteps" TYPE "ProfileSetupStep_new"[] USING ("completedSteps"::text::"ProfileSetupStep_new"[]);
ALTER TABLE "ProfileSetupProgress" ALTER COLUMN "lastActiveStep" TYPE "ProfileSetupStep_new" USING ("lastActiveStep"::text::"ProfileSetupStep_new");
ALTER TABLE "FormDraft" ALTER COLUMN "step" TYPE "ProfileSetupStep_new" USING ("step"::text::"ProfileSetupStep_new");
ALTER TYPE "ProfileSetupStep" RENAME TO "ProfileSetupStep_old";
ALTER TYPE "ProfileSetupStep_new" RENAME TO "ProfileSetupStep";
DROP TYPE "ProfileSetupStep_old";
ALTER TABLE "ProfileSetupProgress" ALTER COLUMN "currentStep" SET DEFAULT 'COMPANY';
COMMIT;

-- AlterTable
ALTER TABLE "ProfileSetupProgress" ALTER COLUMN "currentStep" SET DEFAULT 'COMPANY';
