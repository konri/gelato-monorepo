-- CreateTable
CREATE TABLE "FavoriteStore" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "merchantStoreId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FavoriteStore_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FavoriteStore_userId_idx" ON "FavoriteStore"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "FavoriteStore_userId_merchantStoreId_key" ON "FavoriteStore"("userId", "merchantStoreId");

-- AddForeignKey
ALTER TABLE "FavoriteStore" ADD CONSTRAINT "FavoriteStore_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FavoriteStore" ADD CONSTRAINT "FavoriteStore_merchantStoreId_fkey" FOREIGN KEY ("merchantStoreId") REFERENCES "MerchantStore"("id") ON DELETE CASCADE ON UPDATE CASCADE;
