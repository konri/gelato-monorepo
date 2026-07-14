-- AlterTable
ALTER TABLE "StreakRewardClaim" ALTER COLUMN "benefitType" DROP DEFAULT;

-- RenameIndex
ALTER INDEX "UniqueUserRewardSource" RENAME TO "UserReward_userId_sourceType_sourceEntityId_sourceSubEntity_key";
