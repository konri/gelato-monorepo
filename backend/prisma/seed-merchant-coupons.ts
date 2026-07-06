import { PrismaClient, CouponType, AvailabilityType, DiscountType } from '@prisma/client'

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
    const merchant2 = merchants.length > 1 ? merchants[1] : merchants[0]

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
      // Add points for merchant1
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

      // Add initial transaction
      await prisma.merchantPointTransaction.create({
        data: {
          userId: user.id,
          merchantId: merchant1.id,
          type: 'EARNED',
          amount: 150,
          description: 'Welcome bonus points',
          balanceBefore: 0,
          balanceAfter: 150,
        },
      })

      // Add points for merchant2 if different
      if (merchant2.id !== merchant1.id) {
        await prisma.userMerchantPointBalance.upsert({
          where: {
            userId_merchantId: {
              userId: user.id,
              merchantId: merchant2.id,
            },
          },
          update: {},
          create: {
            userId: user.id,
            merchantId: merchant2.id,
            totalPoints: 100,
            availablePoints: 100,
            lockedPoints: 0,
          },
        })

        await prisma.merchantPointTransaction.create({
          data: {
            userId: user.id,
            merchantId: merchant2.id,
            type: 'EARNED',
            amount: 100,
            description: 'Welcome bonus points',
            balanceBefore: 0,
            balanceAfter: 100,
          },
        })
      }
    }

    // Create sample coupons for merchant1
    const coupons1 = [
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
        discountType: 'PERCENTAGE',
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
        couponType: 'THRESHOLD_DISCOUNT',
        availability: 'FREE',
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
      {
        code: 'TUESDAYSPECIAL',
        title: 'Tuesday 30% Off',
        description: 'Special discount every Tuesday',
        couponType: 'DAY_OF_WEEK',
        availability: 'FREE',
        merchantId: merchant1.id,
        validFrom: new Date('2024-01-01'),
        validUntil: new Date('2024-12-31'),
        dayOfWeek: 'Tuesday',
        discountType: 'PERCENTAGE',
        discountValue: 30,
        usesPerUserLimit: 1,
        isStackable: false,
        currentUses: 0,
        isActive: true,
      },
      {
        code: 'BIRTHDAY50',
        title: 'Birthday Special - 50% Off',
        description: 'Special birthday discount for our valued customers',
        couponType: 'BIRTHDAY',
        availability: 'FREE',
        merchantId: merchant1.id,
        validFrom: new Date('2024-01-01'),
        validUntil: new Date('2024-12-31'),
        discountType: 'PERCENTAGE',
        discountValue: 50,
        daysBeforeBirthday: 3,
        daysAfterBirthday: 3,
        usesPerUserLimit: 1,
        isStackable: false,
        currentUses: 0,
        isActive: true,
      },
    ]

    for (const couponData of coupons1) {
      await prisma.coupon.upsert({
        where: { code: couponData.code },
        update: {},
        create: couponData,
      })
    }

    // Create sample coupons for merchant2 (if different)
    if (merchant2.id !== merchant1.id) {
      const coupons2 = [
        {
          code: 'PIZZA2FOR1',
          title: '2 Pizzas for Price of 1',
          description: 'Order 2 pizzas and pay for only one',
          couponType: 'MULTI_BUY',
          availability: 'POINTS',
          pointsCost: 80,
          merchantId: merchant2.id,
          validFrom: new Date('2024-01-01'),
          validUntil: new Date('2024-12-31'),
          buyQuantity: 2,
          getQuantity: 1,
          usesPerUserLimit: 2,
          globalUsageLimit: 75,
          isStackable: false,
          currentUses: 0,
          isActive: true,
        },
        {
          code: 'WEEKEND15',
          title: 'Weekend 15% Off',
          description: 'Special weekend discount',
          couponType: 'DISCOUNT',
          availability: 'FREE',
          merchantId: merchant2.id,
          validFrom: new Date('2024-01-01'),
          validUntil: new Date('2024-12-31'),
          discountType: 'PERCENTAGE',
          discountValue: 15,
          usesPerUserLimit: 1,
          globalUsageLimit: 150,
          isStackable: true,
          currentUses: 0,
          isActive: true,
        },
      ]

      for (const couponData of coupons2) {
        await prisma.coupon.upsert({
          where: { code: couponData.code },
          update: {},
          create: couponData,
        })
      }
    }

    console.log('✅ Merchant coupons and points seeded successfully!')
    console.log(`📊 Created point balances for ${users.length} users`)
    console.log(`🎟️ Created ${coupons1.length + (merchant2.id !== merchant1.id ? 2 : 0)} coupons`)
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
