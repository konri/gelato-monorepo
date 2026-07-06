import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
(async () => {
  const orders = await prisma.order.findMany({ where: { orderNumber: { startsWith: 'MOCK-' } }, select: { id: true } });
  const ids = orders.map((o: { id: string }) => o.id);
  await prisma.courierLocation.deleteMany({ where: { orderId: { in: ids } } });
  await prisma.orderItem.deleteMany({ where: { orderId: { in: ids } } });
  await prisma.order.deleteMany({ where: { id: { in: ids } } });
  console.log('cleaned', ids.length, 'mock orders');
})().catch(e=>{console.error(e);process.exit(1)}).finally(()=>prisma.$disconnect());
