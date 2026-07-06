/**
 * Non-destructive: set a price on tastes/products that don't have one yet
 * (tastes default to 0 after the add_taste_price migration). Safe to re-run.
 */
import { PrismaClient, TasteType } from '@prisma/client';
const prisma = new PrismaClient();

// Reasonable defaults per taste category (PLN).
const TASTE_PRICE: Record<string, number> = {
  SORBET: 12,
  MILK: 13,
  GELATO: 14,
  VEGAN: 14,
  OTHER: 12,
};

async function main() {
  const tastes = await prisma.taste.findMany({ where: { price: { lte: 0 } } });
  for (const t of tastes) {
    await prisma.taste.update({
      where: { id: t.id },
      data: { price: TASTE_PRICE[t.type] ?? 12 },
    });
  }
  console.log(`✓ Set price on ${tastes.length} taste(s)`);

  const products = await prisma.product.findMany({ where: { price: { lte: 0 } } });
  for (const p of products) {
    await prisma.product.update({ where: { id: p.id }, data: { price: 12 } });
  }
  console.log(`✓ Set price on ${products.length} product(s)`);
}
main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
