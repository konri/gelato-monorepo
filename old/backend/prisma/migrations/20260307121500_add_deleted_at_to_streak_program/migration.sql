ALTER TABLE "StreakProgram"
ADD COLUMN "deletedAt" TIMESTAMP(3);

DROP INDEX IF EXISTS "StreakProgram_merchantId_isActive_idx";

CREATE INDEX "StreakProgram_merchantId_isActive_deletedAt_idx"
ON "StreakProgram"("merchantId", "isActive", "deletedAt");
