import { Resolver, Query, Mutation, Arg, Ctx, Authorized, ID } from 'type-graphql';
import { Role, TasteType as PrismaTasteType } from '@prisma/client';
import { Context } from '../types/Context';
import { TasteType } from '../types/TasteType';
import { canManageSpot } from '../decorators/CheckPermissions';

/**
 * Taste (Ice Cream Flavor) Management Resolver
 *
 * Note: Tastes are per-spot in the schema.
 *
 * Role-based access:
 * - SUPER_ADMIN: Full CRUD on all tastes
 * - SPOTS_ADMIN: Full CRUD on all tastes
 * - SPOT_ADMIN: Can manage tastes at their spots
 * - EMPLOYEE: Can update availability at their spots
 * - CLIENT: Can view available tastes only
 */
@Resolver()
export class TasteResolver {
  /**
   * Get all tastes for a spot
   */
  @Query(() => [TasteType])
  async spotTastes(
    @Arg('spotId', () => ID) spotId: string,
    @Arg('includeUnavailable', { defaultValue: false }) includeUnavailable: boolean,
    @Ctx() { req, prisma }: Context
  ): Promise<TasteType[]> {
    const user = req.user;

    const where: any = { spotId };

    // Only show available tastes to non-staff
    if (!includeUnavailable || !user) {
      where.isAvailable = true;
      where.isActive = true;
    }

    return prisma.taste.findMany({
      where,
      orderBy: [{ type: 'asc' }, { title: 'asc' }],
    }) as Promise<TasteType[]>;
  }

  /**
   * Get taste by ID
   */
  @Query(() => TasteType, { nullable: true })
  async taste(
    @Arg('id', () => ID) id: string,
    @Ctx() { prisma }: Context
  ): Promise<TasteType | null> {
    return prisma.taste.findUnique({
      where: { id },
    }) as Promise<TasteType | null>;
  }

  /**
   * Get tastes by type
   */
  @Query(() => [TasteType])
  async tastesByType(
    @Arg('spotId', () => ID) spotId: string,
    @Arg('type', () => PrismaTasteType) type: PrismaTasteType,
    @Ctx() { prisma }: Context
  ): Promise<TasteType[]> {
    return prisma.taste.findMany({
      where: {
        spotId,
        type,
        isAvailable: true,
        isActive: true,
      },
      orderBy: { title: 'asc' },
    }) as Promise<TasteType[]>;
  }

  /**
   * Create taste (SUPER_ADMIN, SPOTS_ADMIN, SPOT_ADMIN)
   */
  @Authorized([Role.SUPER_ADMIN, Role.SPOTS_ADMIN, Role.SPOT_ADMIN])
  @Mutation(() => TasteType)
  async createTaste(
    @Arg('spotId', () => ID) spotId: string,
    @Arg('title') title: string,
    @Arg('titleLocal') titleLocal: string, // JSON string {pl, en, ua}
    @Arg('type', () => PrismaTasteType) type: PrismaTasteType,
    @Arg('subtitle', { nullable: true }) subtitle?: string,
    @Arg('description', { nullable: true }) description?: string,
    @Arg('descriptionLocal', { nullable: true }) descriptionLocal?: string,
    @Arg('imageUrl', { nullable: true }) imageUrl?: string,
    @Arg('kcalPerPortion', { nullable: true }) kcalPerPortion?: number,
    @Arg('kcalPer100g', { nullable: true }) kcalPer100g?: number,
    @Arg('allergens', () => [String], { defaultValue: [] }) allergens: string[] = [],
    @Ctx() { req, prisma }: Context
  ): Promise<TasteType> {
    const user = req.user!;

    // Check if SPOT_ADMIN has permission
    if (user.roles.includes(Role.SPOT_ADMIN) && !user.roles.includes(Role.SUPER_ADMIN)) {
      const hasPermission = await canManageSpot(user.id, spotId, prisma);
      if (!hasPermission) {
        throw new Error('You do not have permission to manage this spot');
      }
    }

    const taste = await prisma.taste.create({
      data: {
        spotId,
        title,
        titleLocal: JSON.parse(titleLocal),
        subtitle,
        description,
        descriptionLocal: descriptionLocal ? JSON.parse(descriptionLocal) : undefined,
        type,
        imageUrl,
        kcalPerPortion,
        kcalPer100g,
        allergens,
        isAvailable: true,
        isActive: true,
      },
    });

    console.log(`✅ Taste created: ${taste.title} at spot ${spotId}`);

    return taste as TasteType;
  }

  /**
   * Full taste edit (SUPER_ADMIN, SPOTS_ADMIN, SPOT_ADMIN). Only provided
   * fields change. Localized JSON fields are passed as JSON strings.
   */
  @Authorized([Role.SUPER_ADMIN, Role.SPOTS_ADMIN, Role.SPOT_ADMIN])
  @Mutation(() => TasteType)
  async updateTaste(
    @Arg('id', () => ID) id: string,
    @Arg('title', () => String, { nullable: true }) title?: string,
    @Arg('titleLocal', () => String, { nullable: true }) titleLocal?: string,
    @Arg('type', () => PrismaTasteType, { nullable: true }) type?: PrismaTasteType,
    @Arg('subtitle', () => String, { nullable: true }) subtitle?: string,
    @Arg('description', () => String, { nullable: true }) description?: string,
    @Arg('descriptionLocal', () => String, { nullable: true }) descriptionLocal?: string,
    @Arg('ingredients', () => String, { nullable: true }) ingredients?: string,
    @Arg('imageUrl', () => String, { nullable: true }) imageUrl?: string,
    @Arg('price', { nullable: true }) price?: number,
    @Arg('kcalPerPortion', { nullable: true }) kcalPerPortion?: number,
    @Arg('kcalPer100g', { nullable: true }) kcalPer100g?: number,
    @Arg('allergens', () => [String], { nullable: true }) allergens?: string[],
    @Ctx() { req, prisma }: Context
  ): Promise<TasteType> {
    const user = req.user!;
    const existing = await prisma.taste.findUnique({ where: { id }, select: { spotId: true } });
    if (!existing) throw new Error('Taste not found');

    if (user.roles.includes(Role.SPOT_ADMIN) && !user.roles.includes(Role.SUPER_ADMIN) && !user.roles.includes(Role.SPOTS_ADMIN)) {
      const ok = await canManageSpot(user.id, existing.spotId, prisma);
      if (!ok) throw new Error('You do not have permission to manage this spot');
    }

    const data: any = {};
    if (title !== undefined) data.title = title;
    if (titleLocal !== undefined) data.titleLocal = JSON.parse(titleLocal);
    if (type !== undefined) data.type = type;
    if (subtitle !== undefined) data.subtitle = subtitle;
    if (description !== undefined) data.description = description;
    if (descriptionLocal !== undefined) data.descriptionLocal = JSON.parse(descriptionLocal);
    if (ingredients !== undefined) data.ingredients = ingredients;
    if (imageUrl !== undefined) data.imageUrl = imageUrl;
    if (price !== undefined) data.price = price;
    if (kcalPerPortion !== undefined) data.kcalPerPortion = kcalPerPortion;
    if (kcalPer100g !== undefined) data.kcalPer100g = kcalPer100g;
    if (allergens !== undefined) data.allergens = allergens;

    const taste = await prisma.taste.update({ where: { id }, data });
    console.log(`✅ Taste updated: ${taste.title} (${taste.id})`);
    return taste as TasteType;
  }

  /**
   * Update taste availability (SUPER_ADMIN, SPOTS_ADMIN, SPOT_ADMIN, EMPLOYEE)
   */
  @Authorized([Role.SUPER_ADMIN, Role.SPOTS_ADMIN, Role.SPOT_ADMIN, Role.EMPLOYEE])
  @Mutation(() => Boolean)
  async updateTasteAvailability(
    @Arg('id', () => ID) id: string,
    @Arg('isAvailable') isAvailable: boolean,
    @Ctx() { req, prisma }: Context
  ): Promise<boolean> {
    const user = req.user!;

    // Get taste to check spot
    const taste = await prisma.taste.findUnique({
      where: { id },
      select: { spotId: true },
    });

    if (!taste) {
      throw new Error('Taste not found');
    }

    // Check permission — admin or employee of the spot may toggle availability.
    // Uses the real SpotAdminProfile / EmployeeProfile relations.
    if (!user.roles.includes(Role.SUPER_ADMIN) && !user.roles.includes(Role.SPOTS_ADMIN)) {
      const [admin, emp] = await Promise.all([
        prisma.spotAdminProfile.findFirst({ where: { userId: user.id, spotId: taste.spotId } }),
        prisma.employeeProfile.findFirst({ where: { userId: user.id, spotId: taste.spotId } }),
      ]);
      if (!admin && !emp) {
        throw new Error('You do not have permission to manage tastes at this spot');
      }
    }

    await prisma.taste.update({
      where: { id },
      data: { isAvailable },
    });

    console.log(`✅ Taste availability updated: ${id} -> ${isAvailable}`);

    return true;
  }

  /**
   * Delete taste (SUPER_ADMIN, SPOTS_ADMIN, SPOT_ADMIN)
   */
  @Authorized([Role.SUPER_ADMIN, Role.SPOTS_ADMIN, Role.SPOT_ADMIN])
  @Mutation(() => Boolean)
  async deleteTaste(
    @Arg('id', () => ID) id: string,
    @Ctx() { req, prisma }: Context
  ): Promise<boolean> {
    const user = req.user!;

    // Get taste to check spot
    const taste = await prisma.taste.findUnique({
      where: { id },
      select: { spotId: true },
    });

    if (!taste) {
      throw new Error('Taste not found');
    }

    // Check permission
    if (user.roles.includes(Role.SPOT_ADMIN) && !user.roles.includes(Role.SUPER_ADMIN)) {
      const hasPermission = await canManageSpot(user.id, taste.spotId, prisma);
      if (!hasPermission) {
        throw new Error('You do not have permission to manage this spot');
      }
    }

    await prisma.taste.delete({
      where: { id },
    });

    console.log(`✅ Taste deleted: ${id}`);

    return true;
  }
}
