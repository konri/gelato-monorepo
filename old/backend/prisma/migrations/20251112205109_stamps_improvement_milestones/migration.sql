-- CreateEnum
CREATE TYPE "MilestoneType" AS ENUM ('DISCOUNT_PERCENT', 'DISCOUNT_AMOUNT', 'FREE_SERVICE', 'POINTS_REWARD');

-- CreateTable
CREATE TABLE "StampMilestone" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "stampsRequired" INTEGER NOT NULL,
    "milestoneType" "MilestoneType" NOT NULL,
    "discountPercent" DOUBLE PRECISION,
    "discountAmount" DOUBLE PRECISION,
    "pointsReward" INTEGER,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StampMilestone_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StampMilestone_templateId_stampsRequired_key" ON "StampMilestone"("templateId", "stampsRequired");

-- AddForeignKey
ALTER TABLE "StampMilestone" ADD CONSTRAINT "StampMilestone_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "LoyaltyStampCardTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
