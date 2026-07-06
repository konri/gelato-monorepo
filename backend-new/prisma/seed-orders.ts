/**
 * Non-destructive: seed a few mock orders for the test client across statuses,
 * including one IN_TRANSIT with a courier + live location. Safe to re-run
 * (skips if the client already has mock orders).
 */
import { PrismaClient, OrderStatus } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const client = await prisma.user.findFirst({ where: { email: 'client@test.com' } });
  const courierUser = await prisma.user.findFirst({ where: { email: 'courier@test.com' } });
  // Order.courierId / CourierLocation.courierId reference CourierProfile.id.
  const courier = courierUser
    ? await prisma.courierProfile.findFirst({ where: { userId: courierUser.id } })
    : null;
  const spot = await prisma.spot.findFirst({ where: { name: { contains: 'Warsaw Center' } } });
  if (!client || !spot) { console.log('missing client/spot'); return; }

  const existing = await prisma.order.findFirst({
    where: { userId: client.id, orderNumber: { startsWith: 'MOCK-' } },
  });
  if (existing) { console.log('mock orders already exist, skipping'); return; }

  const tastes = await prisma.taste.findMany({ where: { spotId: spot.id }, take: 2 });
  if (tastes.length === 0) { console.log('no tastes'); return; }

  // destination ~1km from spot
  const destLat = spot.latitude + 0.008;
  const destLng = spot.longitude + 0.004;

  const mk = async (
    n: number,
    status: OrderStatus,
    opts: { withCourier?: boolean; daysAgo?: number } = {},
  ) => {
    const created = new Date(Date.now() - (opts.daysAgo ?? 0) * 86400000);
    const order = await prisma.order.create({
      data: {
        orderNumber: `MOCK-${String(n).padStart(3, '0')}`,
        userId: client.id,
        spotId: spot.id,
        status,
        subtotal: 26,
        deliveryFee: 10,
        discount: 0,
        total: 36,
        paymentMethod: 'card',
        paymentStatus: 'paid',
        deliveryAddress: 'ul. Marszałkowska 100, Warszawa',
        deliveryLatitude: destLat,
        deliveryLongitude: destLng,
        buildingType: 'apartment',
        apartmentNumber: '12',
        floor: '3',
        courierId: opts.withCourier && courier ? courier.id : null,
        courierAssignedAt: opts.withCourier ? new Date() : null,
        createdAt: created,
        items: {
          create: [
            { tasteId: tastes[0].id, quantity: 1, pricePerUnit: 13, total: 13 },
            { tasteId: tastes[1].id, quantity: 1, pricePerUnit: 13, total: 13 },
          ],
        },
      },
    });
    // Courier partway between spot and destination for the in-transit order.
    if (opts.withCourier && courier) {
      await prisma.courierLocation.create({
        data: {
          courierId: courier.id,
          orderId: order.id,
          latitude: spot.latitude + 0.004,
          longitude: spot.longitude + 0.002,
        },
      });
    }
    return order;
  };

  await mk(1, OrderStatus.PENDING);
  await mk(2, OrderStatus.PREPARING);
  await mk(3, OrderStatus.IN_TRANSIT, { withCourier: true });
  await mk(4, OrderStatus.DELIVERED, { daysAgo: 2 });
  await mk(5, OrderStatus.CANCELLED, { daysAgo: 5 });
  console.log('✓ Created 5 mock orders for client@test.com');
}
main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
