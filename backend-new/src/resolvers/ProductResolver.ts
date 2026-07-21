import { Resolver, Query, Mutation, Arg, Ctx, Authorized, ID, Int, Float } from 'type-graphql';
import { Role, ProductType as PrismaProductType } from '@prisma/client';
import { Context } from '../types/Context';
import { ProductGraphQLType } from '../types/ProductType';

// Is the user a member of the spot (admin OR employee)? Uses the real
// SpotAdminProfile / EmployeeProfile relations.
async function isSpotMember(
  ctx: Context,
  spotId: string,
  includeEmployees: boolean,
): Promise<boolean> {
  const user = ctx.req.user!;
  if (user.roles.includes(Role.SUPER_ADMIN) || user.roles.includes(Role.SPOTS_ADMIN)) {
    return true;
  }
  const admin = await ctx.prisma.spotAdminProfile.findFirst({
    where: { userId: user.id, spotId },
  });
  if (admin) return true;
  if (includeEmployees) {
    const emp = await ctx.prisma.employeeProfile.findFirst({
      where: { userId: user.id, spotId },
    });
    if (emp) return true;
  }
  return false;
}

// Ensure a SPOT_ADMIN may manage the given spot (global admins always may).
// Employees are NOT allowed to create/edit/delete — only toggle availability.
async function assertCanManageSpot(ctx: Context, spotId: string): Promise<void> {
  const ok = await isSpotMember(ctx, spotId, false);
  if (!ok) throw new Error('You do not have permission to manage this spot');
}

/**
 * Product Resolver — public read access to a spot's non-taste products,
 * plus SPOT_ADMIN management (create/edit/delete/availability).
 */
@Resolver()
export class ProductResolver {
  /**
   * Get all available products for a spot
   */
  @Query(() => [ProductGraphQLType])
  async spotProducts(
    @Arg('spotId', () => ID) spotId: string,
    @Arg('includeUnavailable', { defaultValue: false }) includeUnavailable: boolean,
    @Ctx() { prisma }: Context
  ): Promise<ProductGraphQLType[]> {
    const where: any = { spotId };
    if (!includeUnavailable) {
      where.isAvailable = true;
      where.isActive = true;
    }
    return prisma.product.findMany({
      where,
      orderBy: [{ type: 'asc' }, { name: 'asc' }],
    }) as Promise<ProductGraphQLType[]>;
  }

  /**
   * Get a single product by id
   */
  @Query(() => ProductGraphQLType, { nullable: true })
  async product(
    @Arg('id', () => ID) id: string,
    @Ctx() { prisma }: Context
  ): Promise<ProductGraphQLType | null> {
    return prisma.product.findUnique({ where: { id } }) as Promise<ProductGraphQLType | null>;
  }

  /**
   * Create a product (SPOT_ADMIN). nameLocal/descriptionLocal are JSON strings.
   */
  @Authorized([Role.SUPER_ADMIN, Role.SPOTS_ADMIN, Role.SPOT_ADMIN])
  @Mutation(() => ProductGraphQLType)
  async createProduct(
    @Arg('spotId', () => ID) spotId: string,
    @Arg('name') name: string,
    @Arg('nameLocal') nameLocal: string,
    @Arg('type', () => PrismaProductType) type: PrismaProductType,
    @Arg('price', () => Float) price: number,
    @Arg('description', () => String, { nullable: true }) description: string | undefined,
    @Arg('descriptionLocal', () => String, { nullable: true }) descriptionLocal: string | undefined,
    @Arg('imageUrl', () => String, { nullable: true }) imageUrl: string | undefined,
    @Arg('isBox', () => Boolean, { defaultValue: false }) isBox: boolean,
    @Arg('maxTastes', () => Int, { nullable: true }) maxTastes: number | undefined,
    @Arg('weightGrams', () => Int, { nullable: true }) weightGrams: number | undefined,
    @Arg('kcalPerPortion', () => Float, { nullable: true }) kcalPerPortion: number | undefined,
    @Arg('kcalPer100g', () => Float, { nullable: true }) kcalPer100g: number | undefined,
    @Arg('allergens', () => [String], { defaultValue: [] }) allergens: string[],
    @Arg('loyaltyPoints', () => Int, { nullable: true }) loyaltyPoints: number | undefined,
    @Ctx() ctx: Context
  ): Promise<ProductGraphQLType> {
    await assertCanManageSpot(ctx, spotId);
    const product = await ctx.prisma.product.create({
      data: {
        spotId,
        name,
        nameLocal: JSON.parse(nameLocal),
        type,
        price,
        description,
        descriptionLocal: descriptionLocal ? JSON.parse(descriptionLocal) : undefined,
        imageUrl,
        isBox,
        maxTastes: maxTastes ?? null,
        weightGrams: weightGrams ?? null,
        kcalPerPortion: kcalPerPortion ?? null,
        kcalPer100g: kcalPer100g ?? null,
        allergens,
        loyaltyPoints: loyaltyPoints ?? 0,
        isAvailable: true,
        isActive: true,
      },
    });
    console.log(`✅ Product created: ${product.name} at spot ${spotId}`);
    return product as ProductGraphQLType;
  }

  /**
   * Update a product (SPOT_ADMIN). Only provided fields change.
   */
  @Authorized([Role.SUPER_ADMIN, Role.SPOTS_ADMIN, Role.SPOT_ADMIN])
  @Mutation(() => ProductGraphQLType)
  async updateProduct(
    @Arg('id', () => ID) id: string,
    @Arg('name', () => String, { nullable: true }) name: string | undefined,
    @Arg('nameLocal', () => String, { nullable: true }) nameLocal: string | undefined,
    @Arg('type', () => PrismaProductType, { nullable: true }) type: PrismaProductType | undefined,
    @Arg('price', () => Float, { nullable: true }) price: number | undefined,
    @Arg('description', () => String, { nullable: true }) description: string | undefined,
    @Arg('descriptionLocal', () => String, { nullable: true }) descriptionLocal: string | undefined,
    @Arg('imageUrl', () => String, { nullable: true }) imageUrl: string | undefined,
    @Arg('maxTastes', () => Int, { nullable: true }) maxTastes: number | undefined,
    @Arg('weightGrams', () => Int, { nullable: true }) weightGrams: number | undefined,
    @Arg('kcalPerPortion', () => Float, { nullable: true }) kcalPerPortion: number | undefined,
    @Arg('kcalPer100g', () => Float, { nullable: true }) kcalPer100g: number | undefined,
    @Arg('allergens', () => [String], { nullable: true }) allergens: string[] | undefined,
    @Arg('loyaltyPoints', () => Int, { nullable: true }) loyaltyPoints: number | undefined,
    @Ctx() ctx: Context
  ): Promise<ProductGraphQLType> {
    const existing = await ctx.prisma.product.findUnique({ where: { id } });
    if (!existing) throw new Error('Product not found');
    await assertCanManageSpot(ctx, existing.spotId);

    const data: any = {};
    if (name !== undefined) data.name = name;
    if (nameLocal !== undefined) data.nameLocal = JSON.parse(nameLocal);
    if (type !== undefined) data.type = type;
    if (price !== undefined) data.price = price;
    if (description !== undefined) data.description = description;
    if (descriptionLocal !== undefined) data.descriptionLocal = JSON.parse(descriptionLocal);
    if (imageUrl !== undefined) data.imageUrl = imageUrl;
    if (maxTastes !== undefined) data.maxTastes = maxTastes;
    if (weightGrams !== undefined) data.weightGrams = weightGrams;
    if (kcalPerPortion !== undefined) data.kcalPerPortion = kcalPerPortion;
    if (kcalPer100g !== undefined) data.kcalPer100g = kcalPer100g;
    if (allergens !== undefined) data.allergens = allergens;
    if (loyaltyPoints !== undefined) data.loyaltyPoints = loyaltyPoints;

    const product = await ctx.prisma.product.update({ where: { id }, data });
    console.log(`✅ Product updated: ${product.name} (${product.id})`);
    return product as ProductGraphQLType;
  }

  /**
   * Toggle a product's availability (SPOT_ADMIN + EMPLOYEE — day-to-day op).
   */
  @Authorized([Role.SUPER_ADMIN, Role.SPOTS_ADMIN, Role.SPOT_ADMIN, Role.EMPLOYEE])
  @Mutation(() => Boolean)
  async updateProductAvailability(
    @Arg('id', () => ID) id: string,
    @Arg('isAvailable') isAvailable: boolean,
    @Ctx() ctx: Context
  ): Promise<boolean> {
    const existing = await ctx.prisma.product.findUnique({ where: { id } });
    if (!existing) throw new Error('Product not found');
    // Both admins and employees of the spot may toggle availability.
    const ok = await isSpotMember(ctx, existing.spotId, true);
    if (!ok) throw new Error('You do not have permission to manage this spot');
    await ctx.prisma.product.update({ where: { id }, data: { isAvailable } });
    return true;
  }

  /**
   * Delete a product (SPOT_ADMIN).
   */
  @Authorized([Role.SUPER_ADMIN, Role.SPOTS_ADMIN, Role.SPOT_ADMIN])
  @Mutation(() => Boolean)
  async deleteProduct(
    @Arg('id', () => ID) id: string,
    @Ctx() ctx: Context
  ): Promise<boolean> {
    const existing = await ctx.prisma.product.findUnique({ where: { id } });
    if (!existing) throw new Error('Product not found');
    await assertCanManageSpot(ctx, existing.spotId);
    await ctx.prisma.product.delete({ where: { id } });
    console.log(`✅ Product deleted: ${id}`);
    return true;
  }
}
