import { Resolver, Query, Mutation, Arg, Ctx, ID, Authorized } from 'type-graphql';
import { Role } from '@prisma/client';
import { GraphQLJSON } from 'graphql-type-json';
import { Context } from '../types/Context';
import { CityType } from '../types/CityType';

/**
 * City Resolver
 *
 * Public read access for clients to list/select cities.
 * SUPER_ADMIN can create/update cities.
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

  /**
   * Create a new city (SUPER_ADMIN only).
   * nameLocal is a JSON object of localized names, e.g. { pl, en, ua }.
   */
  @Authorized([Role.SUPER_ADMIN])
  @Mutation(() => CityType)
  async createCity(
    @Arg('name') name: string,
    @Arg('latitude') latitude: number,
    @Arg('longitude') longitude: number,
    @Arg('nameLocal', () => GraphQLJSON, { nullable: true }) nameLocal: any,
    @Arg('country', { defaultValue: 'Poland' }) country: string,
    @Ctx() { prisma }: Context
  ): Promise<CityType> {
    const existing = await prisma.city.findUnique({ where: { name } });
    if (existing) {
      throw new Error(`City "${name}" already exists`);
    }

    // Default localized names to the canonical name when not supplied.
    const localized =
      nameLocal && typeof nameLocal === 'object'
        ? nameLocal
        : { pl: name, en: name, ua: name };

    const city = await prisma.city.create({
      data: {
        name,
        nameLocal: localized,
        country,
        latitude,
        longitude,
        isActive: true,
      },
    });

    console.log(`✅ City created: ${city.name} (${city.id})`);
    return city as CityType;
  }

  /**
   * Update a city (SUPER_ADMIN only).
   */
  @Authorized([Role.SUPER_ADMIN])
  @Mutation(() => CityType)
  async updateCity(
    @Arg('id', () => ID) id: string,
    @Arg('name', { nullable: true }) name?: string,
    @Arg('nameLocal', () => GraphQLJSON, { nullable: true }) nameLocal?: any,
    @Arg('country', { nullable: true }) country?: string,
    @Arg('latitude', { nullable: true }) latitude?: number,
    @Arg('longitude', { nullable: true }) longitude?: number,
    @Arg('isActive', { nullable: true }) isActive?: boolean,
    @Ctx() { prisma }: Context
  ): Promise<CityType> {
    const data: any = {};
    if (name !== undefined) data.name = name;
    if (nameLocal !== undefined) data.nameLocal = nameLocal;
    if (country !== undefined) data.country = country;
    if (latitude !== undefined) data.latitude = latitude;
    if (longitude !== undefined) data.longitude = longitude;
    if (isActive !== undefined) data.isActive = isActive;

    const city = await prisma.city.update({ where: { id }, data });
    console.log(`✅ City updated: ${city.name} (${city.id})`);
    return city as CityType;
  }
}
