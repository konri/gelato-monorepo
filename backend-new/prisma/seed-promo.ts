import { PrismaClient, DiscountType } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const codes = [
    { code: 'SUMMER10', description: '10% off summer promo', discountType: DiscountType.PERCENTAGE, value: 10, maxDiscount: 20, isInfluencer: false },
    { code: 'GELATO5', description: '5 zł off', discountType: DiscountType.FIXED, value: 5, minOrderValue: 20, isInfluencer: false },
    { code: 'INFLU15', description: '15% influencer code', discountType: DiscountType.PERCENTAGE, value: 15, maxDiscount: 30, isInfluencer: true },
  ];
  for (const c of codes) {
    await prisma.promoCode.upsert({ where: { code: c.code }, update: c, create: c });
  }
  console.log(`✓ Upserted ${codes.length} promo codes`);
}
main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
