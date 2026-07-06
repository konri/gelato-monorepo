CREATE TYPE "StreakBenefitType" AS ENUM ('REWARD', 'INFO_ONLY', 'POINTS_MULTIPLIER', 'FIXED_POINTS');

ALTER TABLE "StreakStage"
ADD COLUMN "benefitType" "StreakBenefitType" NOT NULL DEFAULT 'REWARD',
ADD COLUMN "infoMessage" TEXT,
ADD COLUMN "pointsMultiplier" DOUBLE PRECISION,
ADD COLUMN "pointsAmount" INTEGER;

ALTER TABLE "StreakRewardClaim"
ADD COLUMN "benefitType" "StreakBenefitType" NOT NULL DEFAULT 'REWARD',
ADD COLUMN "infoMessage" TEXT,
ADD COLUMN "pointsMultiplier" DOUBLE PRECISION,
ADD COLUMN "pointsAmount" INTEGER;
