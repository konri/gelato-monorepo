ALTER TABLE "CooperatorCompany"
ADD COLUMN "deletedAt" TIMESTAMP(3);

CREATE INDEX "CooperatorCompany_companyOwnerId_deletedAt_idx"
ON "CooperatorCompany"("companyOwnerId", "deletedAt");

CREATE INDEX "CooperatorCompany_cooperatorId_deletedAt_idx"
ON "CooperatorCompany"("cooperatorId", "deletedAt");
