-- Staff (spot admin / employee) login events, for the spot session log + report.
CREATE TABLE "StaffLoginSession" (
  "id"        TEXT NOT NULL,
  "userId"    TEXT NOT NULL,
  "spotId"    TEXT,
  "role"      TEXT NOT NULL,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "loginAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StaffLoginSession_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "StaffLoginSession_spotId_loginAt_idx" ON "StaffLoginSession"("spotId", "loginAt");
CREATE INDEX "StaffLoginSession_userId_loginAt_idx" ON "StaffLoginSession"("userId", "loginAt");

ALTER TABLE "StaffLoginSession" ADD CONSTRAINT "StaffLoginSession_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
