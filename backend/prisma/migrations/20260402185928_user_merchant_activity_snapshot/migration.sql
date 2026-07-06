-- CreateTable
CREATE TABLE "UserMerchantActivitySnapshot" (
    "userId" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "firstActiveAt" TIMESTAMP(3) NOT NULL,
    "lastActiveAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserMerchantActivitySnapshot_pkey" PRIMARY KEY ("userId","merchantId")
);

-- CreateIndex
CREATE INDEX "UserMerchantActivitySnapshot_merchantId_lastActiveAt_idx" ON "UserMerchantActivitySnapshot"("merchantId", "lastActiveAt");

-- AddForeignKey
ALTER TABLE "UserMerchantActivitySnapshot" ADD CONSTRAINT "UserMerchantActivitySnapshot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserMerchantActivitySnapshot" ADD CONSTRAINT "UserMerchantActivitySnapshot_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
