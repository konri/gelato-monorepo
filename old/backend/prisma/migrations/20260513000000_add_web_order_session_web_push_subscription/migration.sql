-- CreateTable
CREATE TABLE "WebOrderSessionWebPushSubscription" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "expirationTime" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WebOrderSessionWebPushSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WebOrderSessionWebPushSubscription_sessionToken_key" ON "WebOrderSessionWebPushSubscription"("sessionToken");

-- AddForeignKey
ALTER TABLE "WebOrderSessionWebPushSubscription" ADD CONSTRAINT "WebOrderSessionWebPushSubscription_sessionToken_fkey" FOREIGN KEY ("sessionToken") REFERENCES "WebOrderSession"("sessionToken") ON DELETE CASCADE ON UPDATE CASCADE;
