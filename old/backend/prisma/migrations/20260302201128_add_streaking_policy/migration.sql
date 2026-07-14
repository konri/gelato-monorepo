-- CreateTable
CREATE TABLE "StreakProgram" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "rewardId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "requiredConsecutiveDays" INTEGER NOT NULL,
    "timezone" TEXT,
    "graceDays" INTEGER NOT NULL DEFAULT 0,
    "repeatable" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StreakProgram_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StreakStage" (
    "id" TEXT NOT NULL,
    "streakProgramId" TEXT NOT NULL,
    "rewardId" TEXT,
    "dayThreshold" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StreakStage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserStreakState" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "streakProgramId" TEXT NOT NULL,
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "lastVisitLocalDate" TIMESTAMP(3),
    "longestStreak" INTEGER NOT NULL DEFAULT 0,
    "claimableRewardsCount" INTEGER NOT NULL DEFAULT 0,
    "claimedCycles" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserStreakState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StreakVisit" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "streakProgramId" TEXT NOT NULL,
    "visitAt" TIMESTAMP(3) NOT NULL,
    "localDate" TIMESTAMP(3) NOT NULL,
    "source" TEXT,
    "idempotencyKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StreakVisit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StreakRewardClaim" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "streakProgramId" TEXT NOT NULL,
    "rewardId" TEXT,
    "streakStageId" TEXT,
    "cycleNumber" INTEGER NOT NULL,
    "claimedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StreakRewardClaim_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StreakProgram_merchantId_isActive_idx" ON "StreakProgram"("merchantId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "StreakProgram_merchantId_name_key" ON "StreakProgram"("merchantId", "name");

-- CreateIndex
CREATE INDEX "StreakStage_streakProgramId_dayThreshold_idx" ON "StreakStage"("streakProgramId", "dayThreshold");

-- CreateIndex
CREATE UNIQUE INDEX "StreakStage_streakProgramId_dayThreshold_key" ON "StreakStage"("streakProgramId", "dayThreshold");

-- CreateIndex
CREATE INDEX "UserStreakState_merchantId_idx" ON "UserStreakState"("merchantId");

-- CreateIndex
CREATE UNIQUE INDEX "UserStreakState_userId_streakProgramId_key" ON "UserStreakState"("userId", "streakProgramId");

-- CreateIndex
CREATE INDEX "StreakVisit_merchantId_localDate_idx" ON "StreakVisit"("merchantId", "localDate");

-- CreateIndex
CREATE UNIQUE INDEX "StreakVisit_userId_streakProgramId_localDate_key" ON "StreakVisit"("userId", "streakProgramId", "localDate");

-- CreateIndex
CREATE UNIQUE INDEX "StreakVisit_userId_streakProgramId_idempotencyKey_key" ON "StreakVisit"("userId", "streakProgramId", "idempotencyKey");

-- CreateIndex
CREATE INDEX "StreakRewardClaim_userId_streakProgramId_idx" ON "StreakRewardClaim"("userId", "streakProgramId");

-- CreateIndex
CREATE INDEX "StreakRewardClaim_merchantId_claimedAt_idx" ON "StreakRewardClaim"("merchantId", "claimedAt");

-- AddForeignKey
ALTER TABLE "StreakProgram" ADD CONSTRAINT "StreakProgram_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StreakProgram" ADD CONSTRAINT "StreakProgram_rewardId_fkey" FOREIGN KEY ("rewardId") REFERENCES "Reward"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StreakStage" ADD CONSTRAINT "StreakStage_streakProgramId_fkey" FOREIGN KEY ("streakProgramId") REFERENCES "StreakProgram"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StreakStage" ADD CONSTRAINT "StreakStage_rewardId_fkey" FOREIGN KEY ("rewardId") REFERENCES "Reward"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserStreakState" ADD CONSTRAINT "UserStreakState_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserStreakState" ADD CONSTRAINT "UserStreakState_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserStreakState" ADD CONSTRAINT "UserStreakState_streakProgramId_fkey" FOREIGN KEY ("streakProgramId") REFERENCES "StreakProgram"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StreakVisit" ADD CONSTRAINT "StreakVisit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StreakVisit" ADD CONSTRAINT "StreakVisit_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StreakVisit" ADD CONSTRAINT "StreakVisit_streakProgramId_fkey" FOREIGN KEY ("streakProgramId") REFERENCES "StreakProgram"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StreakRewardClaim" ADD CONSTRAINT "StreakRewardClaim_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StreakRewardClaim" ADD CONSTRAINT "StreakRewardClaim_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StreakRewardClaim" ADD CONSTRAINT "StreakRewardClaim_streakProgramId_fkey" FOREIGN KEY ("streakProgramId") REFERENCES "StreakProgram"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StreakRewardClaim" ADD CONSTRAINT "StreakRewardClaim_rewardId_fkey" FOREIGN KEY ("rewardId") REFERENCES "Reward"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StreakRewardClaim" ADD CONSTRAINT "StreakRewardClaim_streakStageId_fkey" FOREIGN KEY ("streakStageId") REFERENCES "StreakStage"("id") ON DELETE SET NULL ON UPDATE CASCADE;
