-- DropIndex
DROP INDEX "UserDevice_fcmToken_key";

-- CreateIndex
CREATE INDEX "UserDevice_fcmToken_idx" ON "UserDevice"("fcmToken");
