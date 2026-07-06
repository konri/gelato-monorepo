import { PrismaClient, ProductType } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  // Warsaw Center spot
  const spot = await prisma.spot.findFirst({ where: { name: { contains: 'Warsaw Center' } } });
  if (!spot) { console.log('spot not found'); return; }
  const existing = await prisma.product.findFirst({ where: { spotId: spot.id, isBox: true } });
  if (existing) { console.log('box already exists:', existing.name); return; }
  const box = await prisma.product.create({
    data: {
      spotId: spot.id,
      name: 'Ice Cream Box (4 scoops)',
      nameLocal: { pl: 'Pudełko lodów (4 gałki)', en: 'Ice Cream Box (4 scoops)', ua: 'Коробка морозива (4 кульки)' },
      description: 'Pick up to 4 scoops of any flavors',
      descriptionLocal: {
        pl: 'Wybierz do 4 gałek dowolnych smaków',
        en: 'Pick up to 4 scoops of any flavors',
        ua: 'Виберіть до 4 кульок будь-яких смаків',
      },
      type: ProductType.DESSERT,
      price: 39,
      isBox: true,
      maxTastes: 4,
      weightGrams: 480,
      allergens: [],
    },
  });
  console.log('✓ Created box product:', box.name, box.id);
}
main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
