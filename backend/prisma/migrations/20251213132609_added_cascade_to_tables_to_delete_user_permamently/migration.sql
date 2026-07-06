-- DropForeignKey
ALTER TABLE "Company" DROP CONSTRAINT "Company_userId_fkey";

-- DropForeignKey
ALTER TABLE "CompanyOwner" DROP CONSTRAINT "CompanyOwner_userId_fkey";

-- DropForeignKey
ALTER TABLE "Cooperator" DROP CONSTRAINT "Cooperator_userId_fkey";

-- DropForeignKey
ALTER TABLE "ResetPassword" DROP CONSTRAINT "ResetPassword_userId_fkey";

-- DropForeignKey
ALTER TABLE "UserReferralCode" DROP CONSTRAINT "UserReferralCode_userId_fkey";

-- AddForeignKey
ALTER TABLE "Cooperator" ADD CONSTRAINT "Cooperator_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyOwner" ADD CONSTRAINT "CompanyOwner_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Company" ADD CONSTRAINT "Company_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResetPassword" ADD CONSTRAINT "ResetPassword_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserReferralCode" ADD CONSTRAINT "UserReferralCode_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
