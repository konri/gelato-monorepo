-- CreateTable
CREATE TABLE "WorkSession" (
    "id" TEXT NOT NULL,
    "courierId" TEXT NOT NULL,
    "selectedSpotIds" TEXT[],
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),

    CONSTRAINT "WorkSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WorkSession_courierId_startedAt_idx" ON "WorkSession"("courierId", "startedAt");

-- AddForeignKey
ALTER TABLE "WorkSession" ADD CONSTRAINT "WorkSession_courierId_fkey" FOREIGN KEY ("courierId") REFERENCES "CourierProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
