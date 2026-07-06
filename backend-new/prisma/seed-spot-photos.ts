/**
 * Non-destructive: give spots a coverUrl + photos so the Spots map/carousel and
 * detail look complete (seeded spots have null images). Safe to re-run.
 */
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const COVERS = [
  'https://images.unsplash.com/photo-1501443762994-82bd5dace89a?w=800&q=80', // gelato case
  'https://images.unsplash.com/photo-1567206563064-6f60f40a2b57?w=800&q=80', // cones
  'https://images.unsplash.com/photo-1488900128323-21503983a07e?w=800&q=80', // scoops
];

async function main() {
  const spots = await prisma.spot.findMany({ orderBy: { name: 'asc' } });
  let i = 0;
  for (const spot of spots) {
    if (spot.coverUrl) { i++; continue; }
    const cover = COVERS[i % COVERS.length];
    await prisma.spot.update({
      where: { id: spot.id },
      data: {
        coverUrl: cover,
        photos: [cover, COVERS[(i + 1) % COVERS.length]],
      },
    });
    i++;
  }
  console.log(`✓ Set cover/photos on ${spots.length} spot(s)`);
}
main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
