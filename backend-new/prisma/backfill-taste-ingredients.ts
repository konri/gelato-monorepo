/**
 * Non-destructive backfill: adds rich-text (HTML) ingredients to existing tastes
 * and ensures the single-spot city (Krakow) has a couple of tastes so the
 * "one spot -> jump straight to tastes" flow is demonstrable.
 *
 * Safe to run repeatedly. Does NOT delete anything. Run with:
 *   npx ts-node prisma/backfill-taste-ingredients.ts
 */
import { PrismaClient, TasteType } from '@prisma/client';

const prisma = new PrismaClient();

// Rich HTML ingredients keyed by taste title (bold + colored spans).
const INGREDIENTS_BY_TITLE: Record<string, { en: string; pl: string; ua: string }> = {
  'Vanilla Bean': {
    en: '<p><b>Milk</b>, cream, sugar, <span style="color:#b45309">Madagascar vanilla bean</span>, egg yolk, stabilizer.</p>',
    pl: '<p><b>Mleko</b>, śmietanka, cukier, <span style="color:#b45309">laska wanilii z Madagaskaru</span>, żółtko jaja, stabilizator.</p>',
    ua: '<p><b>Молоко</b>, вершки, цукор, <span style="color:#b45309">ванільний стручок з Мадагаскару</span>, яєчний жовток, стабілізатор.</p>',
  },
  'Strawberry Sorbet': {
    en: '<p><b>Strawberry purée</b> (60%), water, sugar, lemon juice.</p>',
    pl: '<p><b>Przecier truskawkowy</b> (60%), woda, cukier, sok z cytryny.</p>',
    ua: '<p><b>Полуничне пюре</b> (60%), вода, цукор, лимонний сік.</p>',
  },
  'Pistachio Gelato': {
    en: '<p><b>Milk</b>, cream, sugar, <span style="color:#b45309">Sicilian pistachio</span> (15%), <b>tree nuts</b>.</p>',
    pl: '<p><b>Mleko</b>, śmietanka, cukier, <span style="color:#b45309">pistacje sycylijskie</span> (15%), <b>orzechy</b>.</p>',
    ua: '<p><b>Молоко</b>, вершки, цукор, <span style="color:#b45309">сицилійські фісташки</span> (15%), <b>горіхи</b>.</p>',
  },
  'Dark Chocolate': {
    en: '<p><b>Milk</b>, cream, sugar, <span style="color:#b45309">Belgian dark chocolate 70%</span>, cocoa.</p>',
    pl: '<p><b>Mleko</b>, śmietanka, cukier, <span style="color:#b45309">belgijska ciemna czekolada 70%</span>, kakao.</p>',
    ua: '<p><b>Молоко</b>, вершки, цукор, <span style="color:#b45309">бельгійський темний шоколад 70%</span>, какао.</p>',
  },
  'Mango Sorbet': {
    en: '<p><b>Alphonso mango purée</b> (55%), water, sugar, lime juice.</p>',
    pl: '<p><b>Przecier z mango Alphonso</b> (55%), woda, cukier, sok z limonki.</p>',
    ua: '<p><b>Пюре манго Альфонсо</b> (55%), вода, цукор, сік лайма.</p>',
  },
};

async function main() {
  let updated = 0;
  for (const [title, ing] of Object.entries(INGREDIENTS_BY_TITLE)) {
    const res = await prisma.taste.updateMany({
      where: { title, ingredients: null },
      data: { ingredients: ing.en, ingredientsLocal: ing },
    });
    updated += res.count;
  }
  console.log(`✓ Backfilled ingredients on ${updated} taste(s)`);

  // Ensure Krakow (single-spot city) has tastes.
  const krakow = await prisma.city.findFirst({ where: { name: 'Krakow' } });
  if (krakow) {
    const spot = await prisma.spot.findFirst({ where: { cityId: krakow.id } });
    if (spot) {
      const count = await prisma.taste.count({ where: { spotId: spot.id } });
      if (count === 0) {
        await prisma.taste.createMany({
          data: [
            {
              spotId: spot.id,
              title: 'Salted Caramel',
              titleLocal: { pl: 'Słony Karmel', en: 'Salted Caramel', ua: 'Солона Карамель' },
              subtitle: 'Milk-based',
              description: 'Buttery caramel with a pinch of sea salt',
              descriptionLocal: {
                pl: 'Maślany karmel ze szczyptą soli morskiej',
                en: 'Buttery caramel with a pinch of sea salt',
                ua: 'Масляна карамель з дрібкою морської солі',
              },
              type: TasteType.MILK,
              kcalPerPortion: 240,
              kcalPer100g: 200,
              portionSizeGrams: 120,
              allergens: ['milk'],
              ingredients:
                '<p><b>Milk</b>, cream, <span style="color:#b45309">caramelized sugar</span>, sea salt, glucose syrup.</p>',
              ingredientsLocal: {
                pl: '<p><b>Mleko</b>, śmietanka, <span style="color:#b45309">cukier karmelizowany</span>, sól morska, syrop glukozowy.</p>',
                en: '<p><b>Milk</b>, cream, <span style="color:#b45309">caramelized sugar</span>, sea salt, glucose syrup.</p>',
                ua: '<p><b>Молоко</b>, вершки, <span style="color:#b45309">карамелізований цукор</span>, морська сіль, глюкозний сироп.</p>',
              },
            },
            {
              spotId: spot.id,
              title: 'Raspberry Sorbet',
              titleLocal: { pl: 'Sorbet Malinowy', en: 'Raspberry Sorbet', ua: 'Малиновий Сорбет' },
              subtitle: 'Vegan, dairy-free',
              description: 'Tart raspberries, intensely fruity',
              descriptionLocal: {
                pl: 'Kwaśne maliny, intensywnie owocowe',
                en: 'Tart raspberries, intensely fruity',
                ua: 'Кислі малини, інтенсивно фруктові',
              },
              type: TasteType.SORBET,
              kcalPerPortion: 115,
              kcalPer100g: 96,
              portionSizeGrams: 120,
              allergens: [],
              ingredients: '<p><b>Raspberry purée</b> (60%), water, sugar, lemon juice.</p>',
              ingredientsLocal: {
                pl: '<p><b>Przecier malinowy</b> (60%), woda, cukier, sok z cytryny.</p>',
                en: '<p><b>Raspberry purée</b> (60%), water, sugar, lemon juice.</p>',
                ua: '<p><b>Малинове пюре</b> (60%), вода, цукор, лимонний сік.</p>',
              },
            },
          ],
        });
        console.log(`✓ Added 2 tastes to Krakow spot "${spot.name}"`);
      } else {
        console.log(`• Krakow spot already has ${count} taste(s), skipping`);
      }
    }
  }
}

main()
  .catch((e) => {
    console.error('Backfill error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
