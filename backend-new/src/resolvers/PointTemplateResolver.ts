import {
  Resolver,
  Query,
  Mutation,
  Arg,
  Ctx,
  Authorized,
  ID,
  Int,
  ObjectType,
  Field,
} from 'type-graphql';
import { Role } from '@prisma/client';
import { GraphQLJSON } from 'graphql-type-json';
import { Context } from '../types/Context';

/**
 * Point Template — an admin-configured, reusable point award (e.g.
 * "1 Ice Cream Portion" = 10 pts). Staff pick a template + multiplier when
 * awarding loyalty points, so they don't type raw numbers.
 */
@ObjectType('PointTemplate')
export class PointTemplateType {
  @Field(() => ID)
  id!: string;

  @Field(() => ID)
  spotId!: string;

  @Field()
  name!: string;

  @Field(() => GraphQLJSON)
  nameLocal!: any;

  @Field(() => Int)
  points!: number;

  @Field()
  isActive!: boolean;
}

// A staff member (admin or employee) must belong to the spot to manage/use its
// templates. Global admins always may.
async function assertSpotMember(ctx: Context, spotId: string): Promise<void> {
  const user = ctx.req.user!;
  if (user.roles.includes(Role.SUPER_ADMIN) || user.roles.includes(Role.SPOTS_ADMIN)) return;
  const [admin, emp] = await Promise.all([
    ctx.prisma.spotAdminProfile.findFirst({ where: { userId: user.id, spotId } }),
    ctx.prisma.employeeProfile.findFirst({ where: { userId: user.id, spotId } }),
  ]);
  if (!admin && !emp) throw new Error('You do not have access to this spot');
}

// Only admins (not employees) may create/edit/delete templates.
async function assertSpotAdmin(ctx: Context, spotId: string): Promise<void> {
  const user = ctx.req.user!;
  if (user.roles.includes(Role.SUPER_ADMIN) || user.roles.includes(Role.SPOTS_ADMIN)) return;
  const admin = await ctx.prisma.spotAdminProfile.findFirst({
    where: { userId: user.id, spotId },
  });
  if (!admin) throw new Error('Only spot admins can manage point templates');
}

@Resolver()
export class PointTemplateResolver {
  /**
   * Templates for a spot. Staff (admin + employee) read these to award points.
   */
  @Authorized([Role.SUPER_ADMIN, Role.SPOTS_ADMIN, Role.SPOT_ADMIN, Role.EMPLOYEE])
  @Query(() => [PointTemplateType])
  async spotPointTemplates(
    @Arg('spotId', () => ID) spotId: string,
    @Arg('includeInactive', { defaultValue: false }) includeInactive: boolean,
    @Ctx() ctx: Context
  ): Promise<PointTemplateType[]> {
    await assertSpotMember(ctx, spotId);
    return ctx.prisma.pointTemplate.findMany({
      where: includeInactive ? { spotId } : { spotId, isActive: true },
      orderBy: { points: 'asc' },
    }) as unknown as Promise<PointTemplateType[]>;
  }

  @Authorized([Role.SUPER_ADMIN, Role.SPOTS_ADMIN, Role.SPOT_ADMIN])
  @Mutation(() => PointTemplateType)
  async createPointTemplate(
    @Arg('spotId', () => ID) spotId: string,
    @Arg('name') name: string,
    @Arg('points', () => Int) points: number,
    @Arg('nameLocal', () => GraphQLJSON, { nullable: true }) nameLocal: any,
    @Ctx() ctx: Context
  ): Promise<PointTemplateType> {
    await assertSpotAdmin(ctx, spotId);
    if (points <= 0) throw new Error('Points must be positive');
    const tpl = await ctx.prisma.pointTemplate.create({
      data: {
        spotId,
        name,
        nameLocal:
          nameLocal && typeof nameLocal === 'object' ? nameLocal : { pl: name, en: name, ua: name },
        points,
        isActive: true,
      },
    });
    console.log(`✅ Point template created: ${tpl.name} (${tpl.points}pts) at spot ${spotId}`);
    return tpl as unknown as PointTemplateType;
  }

  @Authorized([Role.SUPER_ADMIN, Role.SPOTS_ADMIN, Role.SPOT_ADMIN])
  @Mutation(() => PointTemplateType)
  async updatePointTemplate(
    @Arg('id', () => ID) id: string,
    @Arg('name', () => String, { nullable: true }) name: string | undefined,
    @Arg('nameLocal', () => GraphQLJSON, { nullable: true }) nameLocal: any,
    @Arg('points', () => Int, { nullable: true }) points: number | undefined,
    @Arg('isActive', () => Boolean, { nullable: true }) isActive: boolean | undefined,
    @Ctx() ctx: Context
  ): Promise<PointTemplateType> {
    const existing = await ctx.prisma.pointTemplate.findUnique({ where: { id } });
    if (!existing) throw new Error('Template not found');
    await assertSpotAdmin(ctx, existing.spotId);

    const data: any = {};
    if (name !== undefined) data.name = name;
    if (nameLocal !== undefined) data.nameLocal = nameLocal;
    if (points !== undefined) {
      if (points <= 0) throw new Error('Points must be positive');
      data.points = points;
    }
    if (isActive !== undefined) data.isActive = isActive;

    const tpl = await ctx.prisma.pointTemplate.update({ where: { id }, data });
    return tpl as unknown as PointTemplateType;
  }

  @Authorized([Role.SUPER_ADMIN, Role.SPOTS_ADMIN, Role.SPOT_ADMIN])
  @Mutation(() => Boolean)
  async deletePointTemplate(
    @Arg('id', () => ID) id: string,
    @Ctx() ctx: Context
  ): Promise<boolean> {
    const existing = await ctx.prisma.pointTemplate.findUnique({ where: { id } });
    if (!existing) throw new Error('Template not found');
    await assertSpotAdmin(ctx, existing.spotId);
    await ctx.prisma.pointTemplate.delete({ where: { id } });
    return true;
  }
}
