-- CreateEnum
CREATE TYPE "OperatorScopeMode" AS ENUM ('FULL_MERCHANT', 'STORE_SCOPED');

-- CreateEnum
CREATE TYPE "OperatorPermission" AS ENUM (
    'COMPANY_READ',
    'COMPANY_WRITE',
    'MERCHANT_PROFILE_READ',
    'MERCHANT_PROFILE_WRITE',
    'COOPERATOR_MANAGE',
    'INVITATION_MANAGE',
    'STORE_READ',
    'STORE_WRITE',
    'STAMP_TEMPLATE_READ',
    'STAMP_TEMPLATE_BASE_WRITE',
    'REWARD_READ',
    'REWARD_BASE_WRITE',
    'REWARD_OVERRIDE_WRITE',
    'COUPON_READ',
    'COUPON_BASE_WRITE',
    'COUPON_OVERRIDE_WRITE',
    'STREAK_READ',
    'STREAK_BASE_WRITE',
    'STREAK_OVERRIDE_WRITE',
    'POINTS_PROGRAM_READ',
    'POINTS_PROGRAM_WRITE'
);

-- AlterTable
ALTER TABLE "CooperatorCompany"
ADD COLUMN "scopeMode" "OperatorScopeMode" NOT NULL DEFAULT 'FULL_MERCHANT',
ADD COLUMN "permissions" "OperatorPermission"[] NOT NULL DEFAULT ARRAY[]::"OperatorPermission"[],
ADD COLUMN "storeScopeAll" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "CooperatorCompanyStoreAccess" (
    "id" TEXT NOT NULL,
    "cooperatorCompanyId" TEXT NOT NULL,
    "merchantStoreId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CooperatorCompanyStoreAccess_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UniqueCooperatorCompanyStoreAccess" ON "CooperatorCompanyStoreAccess"("cooperatorCompanyId", "merchantStoreId");

-- CreateIndex
CREATE INDEX "CooperatorCompanyStoreAccess_merchantStoreId_idx" ON "CooperatorCompanyStoreAccess"("merchantStoreId");

-- AddForeignKey
ALTER TABLE "CooperatorCompanyStoreAccess" ADD CONSTRAINT "CooperatorCompanyStoreAccess_cooperatorCompanyId_fkey" FOREIGN KEY ("cooperatorCompanyId") REFERENCES "CooperatorCompany"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CooperatorCompanyStoreAccess" ADD CONSTRAINT "CooperatorCompanyStoreAccess_merchantStoreId_fkey" FOREIGN KEY ("merchantStoreId") REFERENCES "MerchantStore"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "CooperatorInvitation" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "scopeMode" "OperatorScopeMode" NOT NULL DEFAULT 'FULL_MERCHANT',
    "permissions" "OperatorPermission"[] NOT NULL DEFAULT ARRAY[]::"OperatorPermission"[],
    "storeScopeAll" BOOLEAN NOT NULL DEFAULT true,
    "companyOwnerId" TEXT NOT NULL,
    "merchantId" TEXT,
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CooperatorInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CooperatorInvitation_tokenHash_key" ON "CooperatorInvitation"("tokenHash");

-- CreateIndex
CREATE INDEX "CooperatorInvitation_email_idx" ON "CooperatorInvitation"("email");

-- CreateIndex
CREATE INDEX "CooperatorInvitation_companyOwnerId_revokedAt_acceptedAt_expiresAt_idx" ON "CooperatorInvitation"("companyOwnerId", "revokedAt", "acceptedAt", "expiresAt");

-- AddForeignKey
ALTER TABLE "CooperatorInvitation" ADD CONSTRAINT "CooperatorInvitation_companyOwnerId_fkey" FOREIGN KEY ("companyOwnerId") REFERENCES "CompanyOwner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CooperatorInvitation" ADD CONSTRAINT "CooperatorInvitation_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CooperatorInvitation" ADD CONSTRAINT "CooperatorInvitation_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "CooperatorInvitationStoreAccess" (
    "id" TEXT NOT NULL,
    "invitationId" TEXT NOT NULL,
    "merchantStoreId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CooperatorInvitationStoreAccess_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UniqueInvitationStoreAccess" ON "CooperatorInvitationStoreAccess"("invitationId", "merchantStoreId");

-- CreateIndex
CREATE INDEX "CooperatorInvitationStoreAccess_merchantStoreId_idx" ON "CooperatorInvitationStoreAccess"("merchantStoreId");

-- AddForeignKey
ALTER TABLE "CooperatorInvitationStoreAccess" ADD CONSTRAINT "CooperatorInvitationStoreAccess_invitationId_fkey" FOREIGN KEY ("invitationId") REFERENCES "CooperatorInvitation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CooperatorInvitationStoreAccess" ADD CONSTRAINT "CooperatorInvitationStoreAccess_merchantStoreId_fkey" FOREIGN KEY ("merchantStoreId") REFERENCES "MerchantStore"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "RewardStoreOverride" (
    "id" TEXT NOT NULL,
    "rewardId" TEXT NOT NULL,
    "merchantStoreId" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "imageUrl" TEXT,
    "isActive" BOOLEAN,
    "updatedByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RewardStoreOverride_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UniqueRewardStoreOverride" ON "RewardStoreOverride"("rewardId", "merchantStoreId");

-- CreateIndex
CREATE INDEX "RewardStoreOverride_merchantStoreId_idx" ON "RewardStoreOverride"("merchantStoreId");

-- AddForeignKey
ALTER TABLE "RewardStoreOverride" ADD CONSTRAINT "RewardStoreOverride_rewardId_fkey" FOREIGN KEY ("rewardId") REFERENCES "Reward"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RewardStoreOverride" ADD CONSTRAINT "RewardStoreOverride_merchantStoreId_fkey" FOREIGN KEY ("merchantStoreId") REFERENCES "MerchantStore"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "CouponStoreOverride" (
    "id" TEXT NOT NULL,
    "couponId" TEXT NOT NULL,
    "merchantStoreId" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "shortDescription" TEXT,
    "termsAndConditions" TEXT,
    "imageUrl" TEXT,
    "pointsCost" INTEGER,
    "priority" INTEGER,
    "validFrom" TIMESTAMP(3),
    "validUntil" TIMESTAMP(3),
    "isActive" BOOLEAN,
    "updatedByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CouponStoreOverride_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UniqueCouponStoreOverride" ON "CouponStoreOverride"("couponId", "merchantStoreId");

-- CreateIndex
CREATE INDEX "CouponStoreOverride_merchantStoreId_idx" ON "CouponStoreOverride"("merchantStoreId");

-- AddForeignKey
ALTER TABLE "CouponStoreOverride" ADD CONSTRAINT "CouponStoreOverride_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "Coupon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CouponStoreOverride" ADD CONSTRAINT "CouponStoreOverride_merchantStoreId_fkey" FOREIGN KEY ("merchantStoreId") REFERENCES "MerchantStore"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "StreakProgramStoreOverride" (
    "id" TEXT NOT NULL,
    "streakProgramId" TEXT NOT NULL,
    "merchantStoreId" TEXT NOT NULL,
    "name" TEXT,
    "description" TEXT,
    "requiredConsecutiveDays" INTEGER,
    "streakingInterval" INTEGER,
    "graceDays" INTEGER,
    "timezone" TEXT,
    "repeatable" BOOLEAN,
    "isActive" BOOLEAN,
    "updatedByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StreakProgramStoreOverride_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UniqueStreakProgramStoreOverride" ON "StreakProgramStoreOverride"("streakProgramId", "merchantStoreId");

-- CreateIndex
CREATE INDEX "StreakProgramStoreOverride_merchantStoreId_idx" ON "StreakProgramStoreOverride"("merchantStoreId");

-- AddForeignKey
ALTER TABLE "StreakProgramStoreOverride" ADD CONSTRAINT "StreakProgramStoreOverride_streakProgramId_fkey" FOREIGN KEY ("streakProgramId") REFERENCES "StreakProgram"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StreakProgramStoreOverride" ADD CONSTRAINT "StreakProgramStoreOverride_merchantStoreId_fkey" FOREIGN KEY ("merchantStoreId") REFERENCES "MerchantStore"("id") ON DELETE CASCADE ON UPDATE CASCADE;
