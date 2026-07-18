import {
  Resolver,
  Query,
  Arg,
  Ctx,
  Authorized,
  ID,
  Int,
  Float,
  ObjectType,
  Field,
} from 'type-graphql';
import { Role } from '@prisma/client';
import { Context } from '../types/Context';

@ObjectType()
class DashboardEmployeeStat {
  @Field(() => ID, { nullable: true })
  preparedById?: string;

  @Field()
  name!: string;

  @Field(() => Int)
  orders!: number;

  @Field(() => Float)
  revenue!: number;
}

@ObjectType()
class DashboardDailyStat {
  @Field()
  date!: string;

  @Field(() => Float)
  revenue!: number;

  @Field(() => Int)
  orders!: number;
}

@ObjectType()
class SpotDashboardType {
  @Field(() => Float)
  revenue!: number;

  @Field(() => Int)
  orders!: number;

  @Field(() => Float)
  averageOrder!: number;

  @Field(() => [DashboardEmployeeStat])
  byEmployee!: DashboardEmployeeStat[];

  @Field(() => [DashboardDailyStat])
  daily!: DashboardDailyStat[];
}

async function assertSpotAccess(ctx: Context, spotId: string): Promise<void> {
  const user = ctx.req.user!;
  if (user.roles.includes(Role.SUPER_ADMIN) || user.roles.includes(Role.SPOTS_ADMIN)) return;
  const admin = await ctx.prisma.spotAdminProfile.findFirst({
    where: { userId: user.id, spotId },
  });
  if (!admin) throw new Error('Only spot admins can view the dashboard');
}

@Resolver()
export class SpotDashboardResolver {
  /**
   * Income + order stats for a spot over a date range, with an optional
   * per-employee filter. Revenue counts only paid orders. `from`/`to` are
   * ISO date strings; `to` is inclusive of that whole day.
   */
  @Authorized([Role.SUPER_ADMIN, Role.SPOTS_ADMIN, Role.SPOT_ADMIN])
  @Query(() => SpotDashboardType)
  async spotDashboard(
    @Arg('spotId', () => ID) spotId: string,
    @Arg('from') from: string,
    @Arg('to') to: string,
    @Arg('preparedById', () => ID, { nullable: true }) preparedById: string | undefined,
    @Ctx() ctx: Context
  ): Promise<SpotDashboardType> {
    await assertSpotAccess(ctx, spotId);

    const start = new Date(from);
    start.setHours(0, 0, 0, 0);
    const end = new Date(to);
    end.setHours(23, 59, 59, 999);

    const where: any = {
      spotId,
      paymentStatus: 'paid',
      createdAt: { gte: start, lte: end },
    };
    if (preparedById) where.preparedById = preparedById;

    const orders = await ctx.prisma.order.findMany({
      where,
      select: {
        total: true,
        createdAt: true,
        preparedById: true,
        preparedByName: true,
      },
    });

    let revenue = 0;
    const byEmployee = new Map<string, DashboardEmployeeStat>();
    const byDay = new Map<string, DashboardDailyStat>();

    const dayKey = (d: Date) => {
      const m = `${d.getMonth() + 1}`.padStart(2, '0');
      const day = `${d.getDate()}`.padStart(2, '0');
      return `${d.getFullYear()}-${m}-${day}`;
    };

    for (const o of orders) {
      revenue += o.total;

      const empKey = o.preparedById ?? 'unassigned';
      const emp =
        byEmployee.get(empKey) ?? {
          preparedById: o.preparedById ?? undefined,
          name: o.preparedByName ?? 'Unassigned',
          orders: 0,
          revenue: 0,
        };
      emp.orders += 1;
      emp.revenue += o.total;
      byEmployee.set(empKey, emp);

      const dk = dayKey(o.createdAt);
      const day = byDay.get(dk) ?? { date: dk, revenue: 0, orders: 0 };
      day.revenue += o.total;
      day.orders += 1;
      byDay.set(dk, day);
    }

    return {
      revenue,
      orders: orders.length,
      averageOrder: orders.length ? revenue / orders.length : 0,
      byEmployee: Array.from(byEmployee.values()).sort((a, b) => b.revenue - a.revenue),
      daily: Array.from(byDay.values()).sort((a, b) => (a.date < b.date ? -1 : 1)),
    };
  }
}
