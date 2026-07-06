import { PrismaClient } from '@prisma/client'

export class LocationService {
  private prisma: PrismaClient
  private userId?: string

  constructor(prisma: PrismaClient, userId?: string) {
    this.prisma = prisma
    this.userId = userId
  }

  // Haversine formula to calculate distance between two points
  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371 // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1)
    const dLon = this.toRadians(lon2 - lon1)
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180)
  }

  // Get approximate location from IP (basic implementation)
  async getLocationFromIP(ipAddress: string): Promise<{ latitude: number; longitude: number } | null> {
    try {
      // Basic IP geolocation - in production use service like ipapi.co or MaxMind
      const response = await fetch(`http://ip-api.com/json/${ipAddress}`)
      const data = await response.json()

      if (data.status === 'success') {
        return {
          latitude: data.lat,
          longitude: data.lon,
        }
      }
    } catch (error) {
      console.error('IP geolocation failed:', error)
    }
    return null
  }

  // Get approximate location from timezone
  getLocationFromTimezone(timezone: string): { latitude: number; longitude: number } | null {
    // Basic timezone to location mapping
    const timezoneMap: Record<string, { latitude: number; longitude: number }> = {
      'Europe/Warsaw': { latitude: 52.2297, longitude: 21.0122 }, // Warsaw
      'Europe/Berlin': { latitude: 52.52, longitude: 13.405 }, // Berlin
      'Europe/London': { latitude: 51.5074, longitude: -0.1278 }, // London
      'America/New_York': { latitude: 40.7128, longitude: -74.006 }, // NYC
      'America/Los_Angeles': { latitude: 34.0522, longitude: -118.2437 }, // LA
    }

    return timezoneMap[timezone] || null
  }

  // Get coordinates from city name using Nominatim (OpenStreetMap)
  async getCityCoordinates(cityName: string): Promise<{ latitude: number; longitude: number } | null> {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?city=${encodeURIComponent(
          cityName
        )}&country=Poland&format=json&limit=1`,
        {
          headers: {
            'User-Agent': 'EasyBons/1.0',
          },
        }
      )
      const data = await response.json()

      if (data && data.length > 0) {
        return {
          latitude: parseFloat(data[0].lat),
          longitude: parseFloat(data[0].lon),
        }
      }
    } catch (error) {
      console.error('City geocoding failed:', error)
    }
    return null
  }

  // Get user's preferred city from database
  async getUserPreferredCity(): Promise<string | null> {
    if (!this.userId) return null

    try {
      const user = await this.prisma.user.findUnique({
        where: { id: this.userId },
        select: { preferredCity: true },
      })
      return user?.preferredCity || null
    } catch (error) {
      console.error('Failed to get user preferred city:', error)
      return null
    }
  }

  // Generic method to resolve user location (priority: GPS > preferredCity > default)
  async resolveUserLocation(): Promise<{ latitude: number; longitude: number }> {
    // 1. Try to get user's preferred city from database
    const preferredCity = await this.getUserPreferredCity()
    if (preferredCity) {
      const coords = await this.getCityCoordinates(preferredCity)
      if (coords) {
        console.log(`Using user preferred city: ${preferredCity}`, coords)
        return coords
      }
    }

    // 2. Fallback to default location (Krakow, Poland)
    console.log('Using default location: Krakow')
    return { latitude: 50.0647, longitude: 19.945 }
  }

  // Fallback to default location (Krakow, Poland)
  getDefaultLocation(): { latitude: number; longitude: number } {
    return { latitude: 50.0647, longitude: 19.945 }
  }

  async findNearbyStores(latitude: number, longitude: number, radiusKm: number = 10, searchText?: string) {
    const stores = await this.prisma.merchantStore.findMany({
      where: {
        AND: [
          { latitude: { not: null } },
          { longitude: { not: null } },
          { isActive: true },
          searchText
            ? {
                OR: [
                  { name: { contains: searchText, mode: 'insensitive' } },
                  { address: { contains: searchText, mode: 'insensitive' } },
                  { city: { contains: searchText, mode: 'insensitive' } },
                  { merchant: { name: { contains: searchText, mode: 'insensitive' } } },
                ],
              }
            : {},
        ],
      },
      include: {
        category: true,
        merchant: {
          include: {
            category: true,
            streakPrograms: {
              where: { isActive: true, deletedAt: null },
              select: { id: true, name: true },
              take: 1,
            },
          },
        },
      },
    })

    const favoriteStoreIds = new Set<string>()
    if (this.userId) {
      const favorites = await this.prisma.favoriteStore.findMany({
        where: { userId: this.userId },
        select: { merchantStoreId: true },
      })
      favorites.forEach((f) => favoriteStoreIds.add(f.merchantStoreId))
    }

    const FAVORITE_ICON_URL = '/api/static/categories/favorite.svg'
    const FAVORITE_ICON_PNG_URL = '/api/static/categories/favorite.png'
    const STREAK_ICON_PNG_URL = '/api/static/categories/logo_streak.png'

    return stores
      .map((store) => {
        const hasStreak = store.merchant.streakPrograms.length > 0
        return {
          store,
          merchant: store.merchant,
          distanceKm: this.calculateDistance(latitude, longitude, store.latitude!, store.longitude!),
          isFavorite: favoriteStoreIds.has(store.id),
          favoriteIconUrl: FAVORITE_ICON_URL,
          favoriteIconPngUrl: FAVORITE_ICON_PNG_URL,
          hasStreak,
          streakIconPngUrl: hasStreak ? STREAK_ICON_PNG_URL : null,
        }
      })
      .filter((item) => item.distanceKm <= radiusKm)
      .sort((a, b) => a.distanceKm - b.distanceKm)
  }

  async findNearbyCoupons(latitude: number, longitude: number, radiusKm: number = 10, searchText?: string) {
    const coupons = await this.prisma.coupon.findMany({
      where: {
        AND: [
          { isActive: true },
          { validUntil: { gte: new Date() } },
          {
            merchant: {
              stores: {
                some: {
                  AND: [{ latitude: { not: null } }, { longitude: { not: null } }, { isActive: true }],
                },
              },
            },
          },
          searchText
            ? {
                OR: [
                  { title: { contains: searchText, mode: 'insensitive' } },
                  { description: { contains: searchText, mode: 'insensitive' } },
                  { merchant: { name: { contains: searchText, mode: 'insensitive' } } },
                ],
              }
            : {},
        ],
      },
      include: {
        merchant: {
          include: {
            stores: {
              where: {
                AND: [{ latitude: { not: null } }, { longitude: { not: null } }, { isActive: true }],
              },
            },
            category: true,
          },
        },
      },
    })

    const couponsWithDistance = []

    for (const coupon of coupons) {
      for (const store of coupon.merchant.stores) {
        const distanceKm = this.calculateDistance(latitude, longitude, store.latitude!, store.longitude!)

        if (distanceKm <= radiusKm) {
          couponsWithDistance.push({
            coupon,
            merchant: coupon.merchant,
            store,
            distanceKm,
          })
        }
      }
    }

    return couponsWithDistance.sort((a, b) => a.distanceKm - b.distanceKm)
  }

  async findNearbyStreakStores(latitude: number, longitude: number, radiusKm: number = 10, searchText?: string) {
    const stores = await this.prisma.merchantStore.findMany({
      where: {
        AND: [
          { latitude: { not: null } },
          { longitude: { not: null } },
          { isActive: true },
          {
            merchant: {
              streakPrograms: {
                some: { isActive: true, deletedAt: null },
              },
            },
          },
          searchText
            ? {
                OR: [
                  { name: { contains: searchText, mode: 'insensitive' } },
                  { address: { contains: searchText, mode: 'insensitive' } },
                  { city: { contains: searchText, mode: 'insensitive' } },
                  { merchant: { name: { contains: searchText, mode: 'insensitive' } } },
                ],
              }
            : {},
        ],
      },
      include: {
        merchant: {
          include: {
            category: true,
            streakPrograms: {
              where: { isActive: true, deletedAt: null },
              include: { stages: { orderBy: { dayThreshold: 'asc' } } },
              take: 1,
            },
          },
        },
      },
    })

    // Fetch user streak states if logged in
    const userStreakStates = this.userId
      ? await this.prisma.userStreakState.findMany({
          where: { userId: this.userId },
          select: {
            streakProgramId: true,
            currentStreak: true,
            claimableRewardsCount: true,
          },
        })
      : []

    const stateByProgramId = new Map(userStreakStates.map((s) => [s.streakProgramId, s]))

    const results = []
    for (const store of stores) {
      const program = store.merchant.streakPrograms[0]
      if (!program) continue

      const distanceKm = this.calculateDistance(latitude, longitude, store.latitude!, store.longitude!)
      if (distanceKm > radiusKm) continue

      const state = stateByProgramId.get(program.id)
      const requiredConsecutiveDays =
        program.stages.length > 0
          ? program.stages[program.stages.length - 1].dayThreshold
          : program.requiredConsecutiveDays

      results.push({
        store,
        merchant: store.merchant,
        distanceKm,
        streak: {
          streakProgramId: program.id,
          programName: program.name,
          currentStreak: state?.currentStreak ?? 0,
          requiredConsecutiveDays,
          claimableRewardsCount: state?.claimableRewardsCount ?? 0,
          streakingPolicy: program.streakingPolicy ?? 'DAILY',
        },
      })
    }

    return results.sort((a, b) => a.distanceKm - b.distanceKm)
  }

  async findNearbyStampCardStores(latitude: number, longitude: number, radiusKm: number = 10, searchText?: string) {
    const stores = await this.prisma.merchantStore.findMany({
      where: {
        AND: [
          { latitude: { not: null } },
          { longitude: { not: null } },
          { isActive: true },
          {
            merchant: {
              stampTemplates: {
                some: {
                  isActive: true,
                },
              },
            },
          },
          searchText
            ? {
                OR: [
                  { name: { contains: searchText, mode: 'insensitive' } },
                  { address: { contains: searchText, mode: 'insensitive' } },
                  { city: { contains: searchText, mode: 'insensitive' } },
                  { merchant: { name: { contains: searchText, mode: 'insensitive' } } },
                ],
              }
            : {},
        ],
      },
      include: {
        merchant: {
          include: {
            category: true,
            stampTemplates: {
              where: { isActive: true },
              take: 1,
            },
            streakPrograms: {
              where: { isActive: true, deletedAt: null },
              select: { id: true },
              take: 1,
            },
          },
        },
      },
    })

    const userStampCards = this.userId
      ? await this.prisma.loyaltyStampCard.findMany({
          where: { userId: this.userId },
          select: {
            id: true,
            merchantId: true,
            stampsCollected: true,
            stampsRequired: true,
            isActive: true,
          },
          orderBy: {
            isActive: 'desc', // Active cards first
          },
        })
      : []

    // Build map with priority: active cards override inactive ones
    const stampCardMap = new Map()
    for (const card of userStampCards) {
      if (!stampCardMap.has(card.merchantId) || card.isActive) {
        stampCardMap.set(card.merchantId, card)
      }
    }

    return stores
      .map((store) => {
        const distanceKm = this.calculateDistance(latitude, longitude, store.latitude!, store.longitude!)
        const userCard = stampCardMap.get(store.merchant.id)
        const template = store.merchant.stampTemplates[0]

        return {
          store,
          merchant: store.merchant,
          distanceKm,
          stampIconUrl: template?.stampStickerIconUrl || null,
          stampCardProgress: {
            hasCard: !!userCard,
            stampsCollected: userCard?.stampsCollected ?? null,
            stampsRequired: userCard?.stampsRequired ?? null,
            cardId: userCard?.id ?? null,
          },
          hasStreak: store.merchant.streakPrograms.length > 0,
        }
      })
      .filter((item) => item.distanceKm <= radiusKm)
      .sort((a, b) => a.distanceKm - b.distanceKm)
  }
}
