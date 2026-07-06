/**
 * Downloads curated ice-cream photos and uploads them to S3, then sets the
 * imageUrl / images / coverUrl on tastes, spots, prizes and news.
 *
 * Idempotent-ish: re-running re-uploads and overwrites the URLs. Run with:
 *   npx ts-node prisma/seed-photos-s3.ts
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { S3Service } from '../src/services/S3Service';

const prisma = new PrismaClient();

// Unsplash direct image URLs (free to use). Keyword-matched to each item.
const U = (id: string) => `https://images.unsplash.com/${id}?w=900&q=80&fit=crop`;

// Taste title -> photo
const TASTE_PHOTOS: Record<string, string> = {
  'Strawberry Sorbet': U('photo-1633933358116-a27b902fad35'), // pink scoop
  'Raspberry Sorbet': U('photo-1488900128323-21503983a07e'), // red berry ice cream
  'Mango Sorbet': U('photo-1501443762994-82bd5dace89a'), // orange gelato case
  'Pistachio Gelato': U('photo-1560008581-09826d1de69e'), // green pistachio
  'Dark Chocolate': U('photo-1563805042-7684c019e1cb'), // chocolate scoop
  'Vanilla Bean': U('photo-1497034825429-c343d7c6a68f'), // vanilla cone
  'Salted Caramel': U('photo-1587563871167-1ee9c731aefb'), // caramel
};

// Spot cover photos (round-robin of nice shop/gelato shots)
const SPOT_PHOTOS = [
  U('photo-1567206563064-6f60f40a2b57'),
  U('photo-1470124182917-cc6e71b22ecc'),
  U('photo-1516559828984-fb3b99548b21'),
];

// Prize title -> photo
const PRIZE_PHOTOS: Record<string, string> = {
  'Free Coffee': U('photo-1509042239860-f550ce710b93'),
  '50% Off Coupon': U('photo-1607083206968-13611e3d76db'),
  'Premium Sundae': U('photo-1488900128323-21503983a07e'),
  'Free Delivery': U('photo-1526367790999-0150786686a2'),
  'Free Ice Cream Portion': U('photo-1497034825429-c343d7c6a68f'),
};

// News title -> photo
const NEWS_PHOTOS: Record<string, string> = {
  'New Summer Flavors!': U('photo-1501443762994-82bd5dace89a'),
  'Grand Opening in Krakow!': U('photo-1567206563064-6f60f40a2b57'),
  'Weekend Special: Buy 2 Get 1 Free': U('photo-1560008581-09826d1de69e'),
  'Loyalty Program Launch': U('photo-1533228100845-08145b01de14'),
};

// Node 18+ has a global fetch; the TS lib may not type it, so reference loosely.
const httpFetch: (url: string) => Promise<any> = (globalThis as any).fetch;

async function fetchImage(url: string): Promise<{ buffer: Buffer; contentType: string }> {
  const res = await httpFetch(url);
  if (!res.ok) throw new Error(`fetch ${res.status} for ${url}`);
  const contentType = res.headers.get('content-type') || 'image/jpeg';
  const buffer = Buffer.from(await res.arrayBuffer());
  return { buffer, contentType };
}

async function upload(sourceUrl: string, folder: string, id: string): Promise<string> {
  const { buffer, contentType } = await fetchImage(sourceUrl);
  const ext = contentType.includes('png') ? 'png' : 'jpg';
  return S3Service.uploadImage(buffer, `${folder}/${id}`, `photo.${ext}`, contentType);
}

async function main() {
  S3Service.initialize();

  // Tastes
  const tastes = await prisma.taste.findMany();
  for (const t of tastes) {
    const src = TASTE_PHOTOS[t.title];
    if (!src) continue;
    const url = await upload(src, 'tastes', t.id);
    await prisma.taste.update({ where: { id: t.id }, data: { imageUrl: url } });
    console.log(`✓ taste ${t.title}`);
  }

  // Spots (cover + photos array)
  const spots = await prisma.spot.findMany({ orderBy: { name: 'asc' } });
  for (let i = 0; i < spots.length; i++) {
    const spot = spots[i];
    const cover = await upload(SPOT_PHOTOS[i % SPOT_PHOTOS.length], 'spots', spot.id);
    const extra = await upload(SPOT_PHOTOS[(i + 1) % SPOT_PHOTOS.length], 'spots', spot.id);
    await prisma.spot.update({
      where: { id: spot.id },
      data: { coverUrl: cover, photos: [cover, extra] },
    });
    console.log(`✓ spot ${spot.name}`);
  }

  // Prizes
  const prizes = await prisma.prize.findMany();
  for (const p of prizes) {
    const src = PRIZE_PHOTOS[p.title];
    if (!src) continue;
    const url = await upload(src, 'prizes', p.id);
    await prisma.prize.update({ where: { id: p.id }, data: { imageUrl: url } });
    console.log(`✓ prize ${p.title}`);
  }

  // News (images array)
  const news = await prisma.news.findMany();
  for (const n of news) {
    const src = NEWS_PHOTOS[n.title];
    if (!src) continue;
    const url = await upload(src, 'news', n.id);
    await prisma.news.update({ where: { id: n.id }, data: { images: [url] } });
    console.log(`✓ news ${n.title}`);
  }

  console.log('🎉 Photo upload complete');
}

main()
  .catch((e) => {
    console.error('Photo seed error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
