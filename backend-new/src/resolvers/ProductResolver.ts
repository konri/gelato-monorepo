import { Resolver, Query, Arg, Ctx, ID } from 'type-graphql';
import { Context } from '../types/Context';
import { ProductGraphQLType } from '../types/ProductType';

/**
 * Product Resolver — public read access to a spot's non-taste products.
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
}
