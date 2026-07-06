import { Resolver, Query, Arg, Ctx, ID } from 'type-graphql';
import { Context } from '../types/Context';
import { CityType } from '../types/CityType';

/**
 * City Resolver
 *
 * Public read access for clients to list/select cities.
 */
@Resolver()
export class CityResolver {
  /**
   * Get all active cities
   */
  @Query(() => [CityType])
  async cities(
    @Arg('includeInactive', { defaultValue: false }) includeInactive: boolean,
    @Ctx() { prisma }: Context
  ): Promise<CityType[]> {
    return prisma.city.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: { name: 'asc' },
    }) as Promise<CityType[]>;
  }

  /**
   * Get city by ID
   */
  @Query(() => CityType, { nullable: true })
  async city(
    @Arg('id', () => ID) id: string,
    @Ctx() { prisma }: Context
  ): Promise<CityType | null> {
    return prisma.city.findUnique({
      where: { id },
    }) as Promise<CityType | null>;
  }
}
