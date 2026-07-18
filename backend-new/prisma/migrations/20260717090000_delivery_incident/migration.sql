-- Courier-reported delivery incidents (bike damage, lost address, etc.) and
-- a free-text cancel reason.
ALTER TABLE "Order" ADD COLUMN "incidentType" TEXT;
ALTER TABLE "Order" ADD COLUMN "incidentNote" TEXT;
ALTER TABLE "Order" ADD COLUMN "incidentPhotoUrl" TEXT;
ALTER TABLE "Order" ADD COLUMN "incidentReportedAt" TIMESTAMP(3);
ALTER TABLE "Order" ADD COLUMN "cancelReason" TEXT;
