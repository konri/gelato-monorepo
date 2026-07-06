import { PrismaClient, CouponType, AvailabilityType, DiscountType, TransactionType } from '@prisma/client'

const prisma = new PrismaClient()

async function seedMerchantCoupons() {
  console.log('🌱 Seeding merchant coupons and points...')

  try {
    // Find existing merchants
    const merchants = await prisma.merchant.findMany({
      take: 2,
    })

    if (merchants.length === 0) {
      console.log('No merchants found. Please run main seed first.')
      return
    }

    const merchant1 = merchants[0]

    // Find some users
    const users = await prisma.user.findMany({
      where: {
        roles: {
          has: 'CLIENT',
        },
      },
      take: 3,
    })

    if (users.length === 0) {
      console.log('No client users found. Please run main seed first.')
      return
    }

    // Create merchant point balances for users
    for (const user of users) {
      await prisma.userMerchantPointBalance.upsert({
        where: {
          userId_merchantId: {
            userId: user.id,
            merchantId: merchant1.id,
          },
        },
        update: {},
        create: {
          userId: user.id,
          merchantId: merchant1.id,
          totalPoints: 150,
          availablePoints: 150,
          lockedPoints: 0,
        },
      })

      await prisma.merchantPointTransaction.create({
        data: {
          userId: user.id,
          merchantId: merchant1.id,
          type: TransactionType.EARNED,
          amount: 150,
          description: 'Welcome bonus points',
          balanceBefore: 0,
          balanceAfter: 150,
        },
      })
    }

    // Create sample coupons
    const coupons = [
      {
        code: 'BUY1GET1COFFEE',
        title: 'Buy 1 Get 1 Free Coffee',
        description: 'Purchase one coffee and get another one absolutely free',
        couponType: CouponType.MULTI_BUY,
        availability: AvailabilityType.POINTS,
        pointsCost: 50,
        merchantId: merchant1.id,
        validFrom: new Date('2024-01-01'),
        validUntil: new Date('2024-12-31'),
        buyQuantity: 1,
        getQuantity: 1,
        usesPerUserLimit: 3,
        globalUsageLimit: 100,
        isStackable: false,
        currentUses: 0,
        isActive: true,
      },
      {
        code: 'SAVE20PERCENT',
        title: '20% Off Everything',
        description: 'Get 20% discount on all items in store',
        couponType: CouponType.DISCOUNT,
        availability: AvailabilityType.POINTS,
        pointsCost: 30,
        merchantId: merchant1.id,
        validFrom: new Date('2024-01-01'),
        validUntil: new Date('2024-12-31'),
        discountType: DiscountType.PERCENTAGE,
        discountValue: 20,
        usesPerUserLimit: 2,
        globalUsageLimit: 200,
        isStackable: false,
        currentUses: 0,
        isActive: true,
      },
      {
        code: 'SPEND100GET20',
        title: 'Spend 100zł Get 20zł Off',
        description: 'Get 20zł discount when you spend 100zł or more',
        couponType: CouponType.THRESHOLD_DISCOUNT,
        availability: AvailabilityType.FREE,
        merchantId: merchant1.id,
        validFrom: new Date('2024-01-01'),
        validUntil: new Date('2024-12-31'),
        thresholdAmount: 100,
        discountAmount: 20,
        usesPerUserLimit: 1,
        globalUsageLimit: 50,
        isStackable: true,
        currentUses: 0,
        isActive: true,
      },
    ]

    for (const couponData of coupons) {
      await prisma.coupon.upsert({
        where: { code: couponData.code },
        update: {},
        create: couponData,
      })
    }

    console.log('✅ Merchant coupons and points seeded successfully!')
    console.log(`📊 Created point balances for ${users.length} users`)
    console.log(`🎟️ Created ${coupons.length} coupons`)
  } catch (error) {
    console.error('❌ Error seeding merchant coupons:', error)
    throw error
  }
}

// Run if called directly
if (require.main === module) {
  seedMerchantCoupons()
    .catch((e) => {
      console.error(e)
      process.exit(1)
    })
    .finally(async () => {
      await prisma.$disconnect()
    })
}

export { seedMerchantCoupons }
