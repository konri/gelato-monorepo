CREATE TYPE "StreakingPolicy" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY');

ALTER TABLE "StreakProgram"
ADD COLUMN "streakingPolicy" "StreakingPolicy" NOT NULL DEFAULT 'DAILY';

ALTER TABLE "StreakProgram"
ADD COLUMN "streakingInterval" INTEGER NOT NULL DEFAULT 1;
