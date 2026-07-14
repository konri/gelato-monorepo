-- CreateEnum
CREATE TYPE "ProfileSetupStep" AS ENUM ('COMPANY_INFO', 'COMPANY_PHOTO', 'MERCHANT_INFO', 'MERCHANT_LOCATION', 'COMPANY_DETAILS', 'SUBSCRIPTION', 'COMPLETED');

-- CreateEnum
CREATE TYPE "FormType" AS ENUM ('COMPANY', 'MERCHANT', 'MERCHANT_STORE', 'SUBSCRIPTION');

-- CreateTable
CREATE TABLE "ProfileSetupProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "currentStep" "ProfileSetupStep" NOT NULL DEFAULT 'COMPANY_INFO',
    "completedSteps" "ProfileSetupStep"[],
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "lastActiveStep" "ProfileSetupStep",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProfileSetupProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FormDraft" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "formType" "FormType" NOT NULL,
    "formData" JSONB NOT NULL,
    "step" "ProfileSetupStep",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FormDraft_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProfileSetupProgress_userId_key" ON "ProfileSetupProgress"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "FormDraft_userId_formType_key" ON "FormDraft"("userId", "formType");

-- AddForeignKey
ALTER TABLE "ProfileSetupProgress" ADD CONSTRAINT "ProfileSetupProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormDraft" ADD CONSTRAINT "FormDraft_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
