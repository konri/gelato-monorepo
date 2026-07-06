import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
(async () => {
  const spots = await prisma.spot.findMany();
  for (const s of spots) {
    if (!s.accessibilityFeatures) {
      await prisma.spot.update({ where: { id: s.id }, data: { accessibilityFeatures: 'Wheelchair accessible entrance and restroom' } });
    }
  }
  console.log('✓ set accessibility on', spots.length, 'spots');
})().catch(e=>{console.error(e);process.exit(1)}).finally(()=>prisma.$disconnect());
