import {
  Resolver,
  Query,
  Mutation,
  Arg,
  Ctx,
  Authorized,
  ID,
  ObjectType,
  Field,
  FieldResolver,
  Root,
  Int,
} from 'type-graphql';
import { Role } from '@prisma/client';
import { GraphQLJSON } from 'graphql-type-json';
import { Float } from 'type-graphql';
import { Context } from '../types/Context';
import { CheckPermissions, canManageSpot, isSuperAdmin } from '../decorators/CheckPermissions';
import { CityType } from '../types/CityType';
import { TasteType } from '../types/TasteType';

/**
 * Result of checking whether a spot can deliver to a coordinate.
 */
@ObjectType()
class DeliveryAvailability {
  @Field()
  canDeliver!: boolean;

  @Field(() => Float)
  distanceKm!: number;

  @Field(() => Float)
  deliveryRadiusKm!: number;

  @Field(() => Float)
  deliveryFee!: number;

  @Field(() => Float, { nullable: true })
  freeDeliveryThreshold?: number;
}

const haversineKm = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const toRad = (d: number) => d * (Math.PI / 180);
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

/**
 * A spot's admin, with login status so a super admin can revoke access
 * (e.g. when someone resigns from managing a spot).
 */
@ObjectType()
class SpotAdminInfo {
  @Field(() => ID)
  id!: string;

  @Field()
  email!: string;

  @Field({ nullable: true })
  name?: string;

  @Field(() => [String])
  roles!: string[];

  @Field()
  loginDisabled!: boolean;
}

/**
 * Spot GraphQL Type
 */
@ObjectType()
export class SpotType {
  @Field(() => ID)
  id!: string;

  @Field()
  name!: string;

  @Field({ nullable: true })
  description?: string;

  @Field()
  address!: string;

  @Field()
  cityId!: string;

  @Field()
  latitude!: number;

  @Field()
  longitude!: number;

  @Field({ nullable: true })
  phone?: string;

  @Field({ nullable: true })
  email?: string;

  // Photos
  @Field({ nullable: true })
  logoUrl?: string;

  @Field({ nullable: true })
  coverUrl?: string;

  @Field(() => [String])
  photos!: string[];

  // Opening hours JSON ({ monday: "10:00-22:00", ... })
  @Field(() => GraphQLJSON, { nullable: true })
  openingHours?: any;

  // Delivery settings
  @Field()
  deliveryEnabled!: boolean;

  @Field()
  deliveryRadiusKm!: number;

  @Field()
  deliveryFee!: number;

  @Field({ nullable: true })
  freeDeliveryThreshold?: number;

  // Features
  @Field()
  hasSeating!: boolean;

  @Field(() => Int, { nullable: true })
  seatingCapacity?: number;

  @Field({ nullable: true })
  accessibilityFeatures?: string;

  @Field()
  isActive!: boolean;

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;
}

/**
 * Spot Creation Input
 */
class CreateSpotInput {
  @Field()
  id!: string;

  @Field()
  name!: string;

  @Field({ nullable: true })
  description?: string;

  @Field()
  address!: string;

  @Field()
  cityId!: string;

  @Field()
  latitude!: number;

  @Field()
  longitude!: number;

  @Field()
  phone!: string;

  @Field({ defaultValue: 5.0 })
  deliveryRadiusKm!: number;

  @Field({ nullable: true })
  freeDeliveryThreshold?: number;
}

/**
 * Spot Management Resolver
 *
 * Role-based access:
 * - SUPER_ADMIN: Full CRUD on all spots
 * - SPOTS_ADMIN: Full CRUD on all spots
 * - SPOT_ADMIN: Can view and update only their managed spots
 * - EMPLOYEE: Can view their employment spot
 * - CLIENT: Can view active spots only
 */
@Resolver(() => SpotType)
export class SpotResolver {
  /**
   * Resolve the spot's city
   */
  @FieldResolver(() => CityType, { nullable: true })
  async city(@Root() spot: SpotType, @Ctx() { prisma }: Context): Promise<CityType | null> {
    return prisma.city.findUnique({
      where: { id: spot.cityId },
    }) as Promise<CityType | null>;
  }

  /**
   * Resolve the spot's available tastes
   */
  @FieldResolver(() => [TasteType])
  async tastes(
    @Arg('includeUnavailable', { defaultValue: false }) includeUnavailable: boolean,
    @Root() spot: SpotType,
    @Ctx() { prisma }: Context
  ): Promise<TasteType[]> {
    const where: any = { spotId: spot.id };
    if (!includeUnavailable) {
      where.isAvailable = true;
      where.isActive = true;
    }
    return prisma.taste.findMany({
      where,
      orderBy: [{ type: 'asc' }, { title: 'asc' }],
    }) as Promise<TasteType[]>;
  }

  /**
   * Whether the current user has favorited this spot (false if not logged in).
   */
  @FieldResolver(() => Boolean)
  async isFavorite(@Root() spot: SpotType, @Ctx() { req, prisma }: Context): Promise<boolean> {
    const user = req.user;
    if (!user) return false;
    const fav = await prisma.favoriteSpot.findUnique({
      where: { userId_spotId: { userId: user.id, spotId: spot.id } },
    });
    return !!fav;
  }

  /**
   * Get all spots (public - shows only active spots for clients)
   */
  @Query(() => [SpotType])
  async spots(
    @Arg('includeInactive', { defaultValue: false }) includeInactive: boolean,
    @Ctx() { req, prisma }: Context
  ): Promise<SpotType[]> {
    const user = req.user;

    // Admins can see inactive spots if requested
    const canSeeInactive =
      user &&
      (user.roles.includes(Role.SUPER_ADMIN) ||
        user.roles.includes(Role.SPOTS_ADMIN) ||
        user.roles.includes(Role.SPOT_ADMIN));

    const where = includeInactive && canSeeInactive ? {} : { isActive: true };

    return prisma.spot.findMany({
      where,
      orderBy: { name: 'asc' },
    }) as Promise<SpotType[]>;
  }

  /**
   * Get spot by ID
   */
  @Query(() => SpotType, { nullable: true })
  async spot(
    @Arg('id', () => ID) id: string,
    @Ctx() { prisma }: Context
  ): Promise<SpotType | null> {
    return prisma.spot.findUnique({
      where: { id },
    }) as Promise<SpotType | null>;
  }

  /**
   * Get spots by city
   */
  @Query(() => [SpotType])
  async spotsByCity(
    @Arg('cityId', () => ID) cityId: string,
    @Ctx() { prisma }: Context
  ): Promise<SpotType[]> {
    return prisma.spot.findMany({
      where: {
        cityId,
        isActive: true,
      },
      orderBy: { name: 'asc' },
    }) as Promise<SpotType[]>;
  }

  /**
   * The current user's favorite spots.
   */
  @Authorized()
  @Query(() => [SpotType])
  async myFavoriteSpots(@Ctx() { req, prisma }: Context): Promise<SpotType[]> {
    const favorites = await prisma.favoriteSpot.findMany({
      where: { userId: req.user!.id },
      include: { spot: true },
      orderBy: { createdAt: 'desc' },
    });
    return favorites.map((f) => f.spot) as SpotType[];
  }

  /**
   * Toggle a spot as favorite for the current user. Returns the new state.
   */
  @Authorized()
  @Mutation(() => Boolean)
  async toggleFavoriteSpot(
    @Arg('spotId', () => ID) spotId: string,
    @Ctx() { req, prisma }: Context
  ): Promise<boolean> {
    const userId = req.user!.id;
    const existing = await prisma.favoriteSpot.findUnique({
      where: { userId_spotId: { userId, spotId } },
    });
    if (existing) {
      await prisma.favoriteSpot.delete({ where: { id: existing.id } });
      return false;
    }
    await prisma.favoriteSpot.create({ data: { userId, spotId } });
    return true;
  }

  /**
   * Check whether a spot can deliver to a given coordinate (public).
   * Lets the client validate an address before starting checkout.
   */
  @Query(() => DeliveryAvailability)
  async checkDeliveryAvailability(
    @Arg('spotId', () => ID) spotId: string,
    @Arg('latitude', () => Float) latitude: number,
    @Arg('longitude', () => Float) longitude: number,
    @Ctx() { prisma }: Context
  ): Promise<DeliveryAvailability> {
    const spot = await prisma.spot.findUnique({ where: { id: spotId } });
    if (!spot) {
      throw new Error('Spot not found');
    }

    const distanceKm = haversineKm(latitude, longitude, spot.latitude, spot.longitude);
    const canDeliver = spot.deliveryEnabled && distanceKm <= spot.deliveryRadiusKm;

    return {
      canDeliver,
      distanceKm: Math.round(distanceKm * 100) / 100,
      deliveryRadiusKm: spot.deliveryRadiusKm,
      deliveryFee: spot.deliveryFee,
      freeDeliveryThreshold: spot.freeDeliveryThreshold ?? undefined,
    };
  }

  /**
   * Create new spot (SUPER_ADMIN and SPOTS_ADMIN only)
   */
  @Authorized([Role.SUPER_ADMIN, Role.SPOTS_ADMIN])
  @Mutation(() => SpotType)
  async createSpot(
    @Arg('id') id: string,
    @Arg('name') name: string,
    @Arg('address') address: string,
    @Arg('cityId') cityId: string,
    @Arg('latitude') latitude: number,
    @Arg('longitude') longitude: number,
    @Arg('phone') phone: string,
    @Arg('description', { nullable: true }) description?: string,
    @Arg('deliveryEnabled', { defaultValue: true }) deliveryEnabled: boolean = true,
    @Arg('deliveryRadiusKm', { defaultValue: 5.0 }) deliveryRadiusKm: number = 5.0,
    @Arg('freeDeliveryThreshold', { nullable: true }) freeDeliveryThreshold?: number,
    @Ctx() { prisma }: Context
  ): Promise<SpotType> {
    // Validate city exists
    const city = await prisma.city.findUnique({ where: { id: cityId } });
    if (!city) {
      throw new Error(`City with ID ${cityId} not found`);
    }

    const spot = await prisma.spot.create({
      data: {
        id,
        name,
        description,
        address,
        cityId,
        latitude,
        longitude,
        phone,
        deliveryEnabled,
        // Radius only meaningful when delivery is enabled.
        deliveryRadiusKm: deliveryEnabled ? deliveryRadiusKm : 0,
        freeDeliveryThreshold,
        openingHours: {},
        isActive: true,
      },
    });

    console.log(`✅ Spot created: ${spot.name} (${spot.id})`);

    return spot as SpotType;
  }

  /**
   * Update spot (SUPER_ADMIN, SPOTS_ADMIN, or managing SPOT_ADMIN)
   */
  @Authorized([Role.SUPER_ADMIN, Role.SPOTS_ADMIN, Role.SPOT_ADMIN])
  @Mutation(() => SpotType)
  async updateSpot(
    @Arg('id', () => ID) id: string,
    @Arg('name', { nullable: true }) name?: string,
    @Arg('description', { nullable: true }) description?: string,
    @Arg('address', { nullable: true }) address?: string,
    @Arg('phone', { nullable: true }) phone?: string,
    @Arg('latitude', { nullable: true }) latitude?: number,
    @Arg('longitude', { nullable: true }) longitude?: number,
    @Arg('deliveryRadiusKm', { nullable: true }) deliveryRadiusKm?: number,
    @Arg('freeDeliveryThreshold', { nullable: true }) freeDeliveryThreshold?: number,
    @Arg('isActive', { nullable: true }) isActive?: boolean,
    @Arg('email', () => String, { nullable: true }) email?: string,
    @Arg('openingHours', () => String, { nullable: true }) openingHours?: string,
    @Arg('hasSeating', () => Boolean, { nullable: true }) hasSeating?: boolean,
    @Arg('seatingCapacity', () => Int, { nullable: true }) seatingCapacity?: number,
    @Arg('accessibilityFeatures', () => String, { nullable: true }) accessibilityFeatures?: string,
    @Ctx() { req, prisma }: Context
  ): Promise<SpotType> {
    const user = req.user!;

    // Check if SPOT_ADMIN has permission to manage this spot
    if (user.roles.includes(Role.SPOT_ADMIN) && !isSuperAdmin(user)) {
      const hasPermission = await canManageSpot(user.id, id, prisma);
      if (!hasPermission) {
        throw new Error('You do not have permission to manage this spot');
      }
    }

    // Build update data (only include defined fields)
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (address !== undefined) updateData.address = address;
    if (phone !== undefined) updateData.phone = phone;
    if (latitude !== undefined) updateData.latitude = latitude;
    if (longitude !== undefined) updateData.longitude = longitude;
    if (deliveryRadiusKm !== undefined) updateData.deliveryRadiusKm = deliveryRadiusKm;
    if (freeDeliveryThreshold !== undefined) updateData.freeDeliveryThreshold = freeDeliveryThreshold;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (email !== undefined) updateData.email = email;
    // openingHours arrives as a JSON string ({ monday: "10:00-22:00", ... }).
    if (openingHours !== undefined) updateData.openingHours = JSON.parse(openingHours);
    if (hasSeating !== undefined) updateData.hasSeating = hasSeating;
    if (seatingCapacity !== undefined) updateData.seatingCapacity = seatingCapacity;
    if (accessibilityFeatures !== undefined) updateData.accessibilityFeatures = accessibilityFeatures;

    const spot = await prisma.spot.update({
      where: { id },
      data: updateData,
    });

    console.log(`✅ Spot updated: ${spot.name} (${spot.id})`);

    return spot as SpotType;
  }

  /**
   * Replace a spot's gallery photos (SUPER_ADMIN, SPOTS_ADMIN, managing SPOT_ADMIN).
   * The client sends the full desired array — used to remove/reorder photos.
   */
  @Authorized([Role.SUPER_ADMIN, Role.SPOTS_ADMIN, Role.SPOT_ADMIN])
  @Mutation(() => SpotType)
  async setSpotPhotos(
    @Arg('id', () => ID) id: string,
    @Arg('photos', () => [String]) photos: string[],
    @Ctx() { req, prisma }: Context
  ): Promise<SpotType> {
    const user = req.user!;
    if (user.roles.includes(Role.SPOT_ADMIN) && !isSuperAdmin(user) && !user.roles.includes(Role.SPOTS_ADMIN)) {
      const ok = await canManageSpot(user.id, id, prisma);
      if (!ok) throw new Error('You do not have permission to manage this spot');
    }
    const spot = await prisma.spot.update({ where: { id }, data: { photos } });
    return spot as SpotType;
  }

  /**
   * Delete spot (SUPER_ADMIN only)
   */
  @Authorized([Role.SUPER_ADMIN])
  @Mutation(() => Boolean)
  async deleteSpot(
    @Arg('id', () => ID) id: string,
    @Ctx() { prisma }: Context
  ): Promise<boolean> {
    await prisma.spot.delete({
      where: { id },
    });

    console.log(`✅ Spot deleted: ${id}`);

    return true;
  }

  /**
   * Assign spot admin to spot (SUPER_ADMIN and SPOTS_ADMIN only)
   */
  @Authorized([Role.SUPER_ADMIN, Role.SPOTS_ADMIN])
  @Mutation(() => Boolean)
  async assignSpotAdmin(
    @Arg('spotId', () => ID) spotId: string,
    @Arg('userId', () => ID) userId: string,
    @Ctx() { prisma }: Context
  ): Promise<boolean> {
    // Verify user exists and has SPOT_ADMIN role
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    if (!user.roles.includes(Role.SPOT_ADMIN)) {
      throw new Error('User must have SPOT_ADMIN role');
    }

    // Add user to spot's admins
    await prisma.spot.update({
      where: { id: spotId },
      data: {
        admins: {
          connect: { id: userId },
        },
      },
    });

    console.log(`✅ Spot admin assigned: User ${userId} -> Spot ${spotId}`);

    return true;
  }

  /**
   * Remove spot admin from spot (SUPER_ADMIN and SPOTS_ADMIN only)
   */
  @Authorized([Role.SUPER_ADMIN, Role.SPOTS_ADMIN])
  @Mutation(() => Boolean)
  async removeSpotAdmin(
    @Arg('spotId', () => ID) spotId: string,
    @Arg('userId', () => ID) userId: string,
    @Ctx() { prisma }: Context
  ): Promise<boolean> {
    await prisma.spot.update({
      where: { id: spotId },
      data: {
        admins: {
          disconnect: { id: userId },
        },
      },
    });

    console.log(`✅ Spot admin removed: User ${userId} from Spot ${spotId}`);

    return true;
  }

  /**
   * List the admins managing a spot, with login status (SUPER_ADMIN / SPOTS_ADMIN).
   * Uses the SpotAdminProfile relation (the real link between users and spots).
   */
  @Authorized([Role.SUPER_ADMIN, Role.SPOTS_ADMIN])
  @Query(() => [SpotAdminInfo])
  async spotAdmins(
    @Arg('spotId', () => ID) spotId: string,
    @Ctx() { prisma }: Context
  ): Promise<SpotAdminInfo[]> {
    const profiles = await prisma.spotAdminProfile.findMany({
      where: { spotId },
      include: { user: true },
    });
    return profiles.map((p) => ({
      id: p.user.id,
      email: p.user.email,
      name: p.user.name ?? undefined,
      roles: p.user.roles as string[],
      loginDisabled: p.user.loginDisabled,
    }));
  }

  /**
   * Enable or disable a staff member's login (SUPER_ADMIN / SPOTS_ADMIN).
   * Disabling also bumps tokenVersion so existing sessions are invalidated.
   */
  @Authorized([Role.SUPER_ADMIN, Role.SPOTS_ADMIN])
  @Mutation(() => Boolean)
  async setUserLoginDisabled(
    @Arg('userId', () => ID) userId: string,
    @Arg('disabled') disabled: boolean,
    @Ctx() { prisma }: Context
  ): Promise<boolean> {
    await prisma.user.update({
      where: { id: userId },
      data: {
        loginDisabled: disabled,
        // Invalidate active tokens when disabling.
        ...(disabled ? { tokenVersion: { increment: 1 } } : {}),
      },
    });
    console.log(`✅ User ${userId} login ${disabled ? 'disabled' : 'enabled'}`);
    return true;
  }
}
