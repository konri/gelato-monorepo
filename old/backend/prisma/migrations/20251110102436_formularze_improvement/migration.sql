-- CreateEnum
CREATE TYPE "CouponType" AS ENUM ('MULTI_BUY', 'DISCOUNT', 'DAY_OF_WEEK', 'THRESHOLD_DISCOUNT', 'ITEM_SPECIFIC', 'BIRTHDAY', 'ACTIVITY');

-- CreateEnum
CREATE TYPE "AvailabilityType" AS ENUM ('FREE', 'POINTS');

-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('PERCENTAGE', 'AMOUNT');

-- CreateTable
CREATE TABLE "Coupon" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "couponType" "CouponType" NOT NULL,
    "availability" "AvailabilityType" NOT NULL,
    "pointsCost" INTEGER,
    "merchantId" TEXT NOT NULL,
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validUntil" TIMESTAMP(3) NOT NULL,
    "maxUsesPerUser" INTEGER,
    "totalQuantity" INTEGER,
    "assignToUserId" TEXT,
    "exclusivityGroups" TEXT[],
    "buyQuantity" INTEGER,
    "getQuantity" INTEGER,
    "discountType" "DiscountType",
    "discountValue" DOUBLE PRECISION,
    "dayOfWeek" TEXT,
    "thresholdAmount" DOUBLE PRECISION,
    "discountAmount" DOUBLE PRECISION,
    "itemName" TEXT,
    "itemBarcode" TEXT,
    "daysBeforeBirthday" INTEGER,
    "daysAfterBirthday" INTEGER,
    "activityType" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Coupon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserCoupon" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "couponId" TEXT NOT NULL,
    "isUsed" BOOLEAN NOT NULL DEFAULT false,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserCoupon_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Coupon_code_key" ON "Coupon"("code");

-- CreateIndex
CREATE UNIQUE INDEX "UserCoupon_userId_couponId_key" ON "UserCoupon"("userId", "couponId");

-- AddForeignKey
ALTER TABLE "Coupon" ADD CONSTRAINT "Coupon_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCoupon" ADD CONSTRAINT "UserCoupon_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCoupon" ADD CONSTRAINT "UserCoupon_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "Coupon"("id") ON DELETE CASCADE ON UPDATE CASCADE;
