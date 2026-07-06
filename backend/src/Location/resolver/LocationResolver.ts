import { Resolver, Query, Arg, Ctx, Authorized } from 'type-graphql'
import { Context } from '../../shared/interface/Context'
import { LocationSearchInput, FallbackLocationInput } from '../inputType/LocationSearchInput'
import { LocationSearchResult, StoreWithDistance, CouponWithDistance } from '../objectType/LocationResult'
import { StampCardStoreWithDistance } from '../objectType/StampCardStoreWithDistance'
import { UnifiedSearchResult } from '../objectType/UnifiedSearchResult'
import { StreakStoreWithDistance } from '../objectType/StreakStoreWithDistance'
import { LocationService } from '../service/LocationService'
import { FilterService } from '../../shared/services/FilterService'
import { SortingService } from '../../shared/services/SortingService'
import { UnifiedSearchInput } from '../../shared/inputTypes/UnifiedSearchInput'
import { FilterMetadata } from '../../shared/objectTypes/FilterMetadata'
import { SearchSortOrder } from '../../shared/enums/SortOrder'
import { Role } from '../../User/objectType/Role'

@Resolver()
export class LocationResolver {
  private locationService: LocationService

  constructor() {
    // Will be initialized with prisma context in queries
  }

  @Query(() => LocationSearchResult)
  async searchByLocation(
    @Arg('location') location: LocationSearchInput,
    @Ctx() ctx: Context
  ): Promise<LocationSearchResult> {
    this.locationService = new LocationService(ctx.prisma)

    const { latitude, longitude, radiusKm = 10, searchText } = location

    if (!latitude || !longitude) {
      throw new Error('Latitude and longitude are required')
    }

    const [stores, coupons] = await Promise.all([
      this.locationService.findNearbyStores(latitude, longitude, radiusKm, searchText),
      this.locationService.findNearbyCoupons(latitude, longitude, radiusKm, searchText),
    ])

    return {
      stores: stores as any,
      coupons: coupons as any,
      searchLatitude: latitude,
      searchLongitude: longitude,
      searchRadiusKm: radiusKm,
    }
  }

  @Query(() => LocationSearchResult)
  async searchByFallbackLocation(
    @Arg('fallback', { nullable: true }) fallback: FallbackLocationInput,
    @Arg('radiusKm', { nullable: true, defaultValue: 10 }) radiusKm: number,
    @Arg('searchText', { nullable: true }) searchText: string,
    @Ctx() ctx: Context
  ): Promise<LocationSearchResult> {
    const userId = ctx.req.user?.id
    this.locationService = new LocationService(ctx.prisma, userId)

    let location: { latitude: number; longitude: number } | null = null

    // Try IP geolocation first
    if (fallback?.ipAddress) {
      location = await this.locationService.getLocationFromIP(fallback.ipAddress)
    }

    // Fallback to timezone
    if (!location && fallback?.timezone) {
      location = this.locationService.getLocationFromTimezone(fallback.timezone)
    }

    // Try user's preferred city from database
    if (!location) {
      location = await this.locationService.resolveUserLocation()
    }

    const [stores, coupons] = await Promise.all([
      this.locationService.findNearbyStores(location.latitude, location.longitude, radiusKm, searchText),
      this.locationService.findNearbyCoupons(location.latitude, location.longitude, radiusKm, searchText),
    ])

    return {
      stores: stores as any,
      coupons: coupons as any,
      searchLatitude: location.latitude,
      searchLongitude: location.longitude,
      searchRadiusKm: radiusKm,
    }
  }

  @Query(() => [StoreWithDistance])
  async nearbyStores(
    @Arg('location') location: LocationSearchInput,
    @Ctx() ctx: Context
  ): Promise<StoreWithDistance[]> {
    this.locationService = new LocationService(ctx.prisma)

    const { latitude, longitude, radiusKm = 10, searchText } = location

    if (!latitude || !longitude) {
      throw new Error('Latitude and longitude are required')
    }

    const stores = await this.locationService.findNearbyStores(latitude, longitude, radiusKm, searchText)

    return stores as any
  }

  @Query(() => [CouponWithDistance])
  async nearbyCoupons(
    @Arg('location') location: LocationSearchInput,
    @Ctx() ctx: Context
  ): Promise<CouponWithDistance[]> {
    this.locationService = new LocationService(ctx.prisma)

    const { latitude, longitude, radiusKm = 10, searchText } = location

    if (!latitude || !longitude) {
      throw new Error('Latitude and longitude are required')
    }

    const coupons = await this.locationService.findNearbyCoupons(latitude, longitude, radiusKm, searchText)

    return coupons as any
  }

  @Authorized([Role.CLIENT, Role.OWNER, Role.COOPERATOR, Role.ADMIN])
  @Query(() => [StampCardStoreWithDistance])
  async nearbyStampCardStores(
    @Arg('location', { nullable: true }) location: LocationSearchInput,
    @Ctx() ctx: Context
  ): Promise<StampCardStoreWithDistance[]> {
    if (!ctx.req.user?.id) {
      throw new Error('User not authenticated')
    }

    this.locationService = new LocationService(ctx.prisma, ctx.req.user.id)

    let latitude: number
    let longitude: number
    let radiusKm = 10
    let searchText: string | undefined

    if (location?.latitude && location?.longitude) {
      latitude = location.latitude
      longitude = location.longitude
      radiusKm = location.radiusKm || 10
      searchText = location.searchText
    } else {
      // Use generic location resolution (preferredCity > default)
      const coords = await this.locationService.resolveUserLocation()
      latitude = coords.latitude
      longitude = coords.longitude
      radiusKm = 25 // Larger radius for city-based search
    }

    const stores = await this.locationService.findNearbyStampCardStores(latitude, longitude, radiusKm, searchText)

    return stores as any
  }

  // NOWY ENDPOINT: Zunifikowane wyszukiwanie z filtrowaniem i sortowaniem
  @Query(() => UnifiedSearchResult, {
    description: 'Zunifikowane wyszukiwanie z zaawansowanym filtrowaniem i sortowaniem',
  })
  async unifiedSearch(@Arg('filters') filters: UnifiedSearchInput, @Ctx() ctx: Context): Promise<UnifiedSearchResult> {
    const userId = ctx.req.user?.id
    this.locationService = new LocationService(ctx.prisma, userId)
    const filterService = new FilterService(ctx.prisma)

    // 1. Rozwiąż lokalizację użytkownika
    let latitude: number
    let longitude: number
    let radiusKm = filters.location?.radiusKm || 10

    if (filters.location?.latitude && filters.location?.longitude) {
      latitude = filters.location.latitude
      longitude = filters.location.longitude
    } else {
      const coords = await this.locationService.resolveUserLocation()
      latitude = coords.latitude
      longitude = coords.longitude
      radiusKm = 25 // Większy promień dla wyszukiwania bez GPS
    }

    // 2. Pobierz dane z bazy
    const [allStores, allCoupons, allStampCardStores, allStreakStores] = await Promise.all([
      this.locationService.findNearbyStores(latitude, longitude, radiusKm, filters.search?.searchText),
      this.locationService.findNearbyCoupons(latitude, longitude, radiusKm, filters.search?.searchText),
      userId
        ? this.locationService.findNearbyStampCardStores(latitude, longitude, radiusKm, filters.search?.searchText)
        : [],
      this.locationService.findNearbyStreakStores(latitude, longitude, radiusKm, filters.search?.searchText),
    ])

    // 3. Zastosuj filtry
    let filteredStores = this.applyStoreFilters(allStores, filters)
    let filteredCoupons = await this.applyCouponFilters(allCoupons, filters, userId, ctx.prisma)
    let filteredStampCards = this.applyStampCardFilters(allStampCardStores, filters)
    let filteredStreakStores = this.applyStreakStoreFilters(allStreakStores, filters)

    // 3b. Filtruj tylko nagrody z aktywną aktywnością usera
    if (filters.search?.onlyUserActive && userId) {
      const [
        userStampMerchantIds,
        userStreakMerchantIds,
        userPointMerchantIds,
        userCouponMerchantIds,
      ] = await Promise.all([
        ctx.prisma.loyaltyStampCard
          .findMany({ where: { userId, isActive: true }, select: { merchantId: true } })
          .then((r) => new Set(r.map((x) => x.merchantId))),
        ctx.prisma.userStreakState
          .findMany({ where: { userId }, select: { merchantId: true } })
          .then((r) => new Set(r.map((x) => x.merchantId))),
        ctx.prisma.userMerchantPointBalance
          .findMany({ where: { userId, availablePoints: { gt: 0 } }, select: { merchantId: true } })
          .then((r) => new Set(r.map((x) => x.merchantId))),
        ctx.prisma.userCoupon
          .findMany({ where: { userId, isUsed: false }, select: { coupon: { select: { merchantId: true } } } })
          .then((r) => new Set(r.map((x) => x.coupon.merchantId))),
      ])

      filteredStores = filteredStores.filter((s: any) => {
        const mid = s.merchant?.id || s.merchantId
        return (
          userStampMerchantIds.has(mid) ||
          userStreakMerchantIds.has(mid) ||
          userPointMerchantIds.has(mid) ||
          userCouponMerchantIds.has(mid)
        )
      })
      filteredCoupons = filteredCoupons.filter((c: any) => userCouponMerchantIds.has(c.merchant?.id || c.merchantId))
      filteredStampCards = filteredStampCards.filter((s: any) =>
        userStampMerchantIds.has(s.merchant?.id || s.merchantId)
      )
      filteredStreakStores = filteredStreakStores.filter((s: any) =>
        userStreakMerchantIds.has(s.merchant?.id || s.merchantId)
      )
    }

    // 4. Sortowanie
    const sortBy = filters.sort?.sortBy || SearchSortOrder.DISTANCE
    const reverse = filters.sort?.reverse || false

    console.log('🔍 DEBUG SORTING:', { sortBy, reverse, type: typeof sortBy })

    filteredStores = SortingService.sortItems(filteredStores as any, sortBy, reverse)
    filteredCoupons = SortingService.sortItems(filteredCoupons as any, sortBy, reverse)
    filteredStampCards = SortingService.sortItems(filteredStampCards as any, sortBy, reverse)
    filteredStreakStores = SortingService.sortItems(filteredStreakStores as any, sortBy, reverse)

    // 5. Paginacja
    const page = filters.pagination?.page || 1
    const pageSize = filters.pagination?.pageSize || 20
    const skip = filters.pagination?.skip || (page - 1) * pageSize
    const take = filters.pagination?.take || pageSize

    const paginatedStores = filteredStores.slice(skip, skip + take)
    const paginatedCoupons = filteredCoupons.slice(skip, skip + take)
    const paginatedStampCards = filteredStampCards.slice(skip, skip + take)
    const paginatedStreakStores = filteredStreakStores.slice(skip, skip + take)

    // 6. Generuj metadane filtrów
    const metadata = await this.generateMetadata(
      filters,
      allStores,
      allCoupons,
      allStampCardStores,
      filteredStores,
      filteredCoupons,
      filteredStampCards,
      latitude,
      longitude
    )

    return {
      stores: paginatedStores as any,
      coupons: paginatedCoupons as any,
      stampCardStores: paginatedStampCards as any,
      streakStores: paginatedStreakStores as any,
      metadata,
      searchLatitude: latitude,
      searchLongitude: longitude,
    }
  }

  // NOWY ENDPOINT: Pobierz dostępne opcje filtrowania dla kuponów
  @Query(() => FilterMetadata, { description: 'Pobierz dostępne opcje filtrowania dla kuponów' })
  async getCouponFilterOptions(
    @Arg('filters', { nullable: true }) filters: UnifiedSearchInput,
    @Ctx() ctx: Context
  ): Promise<FilterMetadata> {
    const filterService = new FilterService(ctx.prisma)
    return filterService.getCouponFilterMetadata(filters || {}, ctx.req.user?.id)
  }

  // NOWY ENDPOINT: Pobierz dostępne opcje filtrowania dla sklepów
  @Query(() => FilterMetadata, { description: 'Pobierz dostępne opcje filtrowania dla sklepów' })
  async getStoreFilterOptions(
    @Arg('filters', { nullable: true }) filters: UnifiedSearchInput,
    @Ctx() ctx: Context
  ): Promise<FilterMetadata> {
    const filterService = new FilterService(ctx.prisma)
    return filterService.getStoreFilterMetadata(filters || {}, ctx.req.user?.id)
  }

  // NOWY ENDPOINT: Pobierz dostępne opcje filtrowania dla kart stempli
  @Query(() => FilterMetadata, { description: 'Pobierz dostępne opcje filtrowania dla kart stempli' })
  async getStampCardFilterOptions(
    @Arg('filters', { nullable: true }) filters: UnifiedSearchInput,
    @Ctx() ctx: Context
  ): Promise<FilterMetadata> {
    const filterService = new FilterService(ctx.prisma)
    return filterService.getStampCardFilterMetadata(filters || {}, ctx.req.user?.id)
  }

  // Pomocnicze metody filtrowania
  private applyStoreFilters(stores: any[], filters: UnifiedSearchInput): any[] {
    let filtered = [...stores]

    // Filtr kategorii po ID
    if (filters.category?.categoryIds && filters.category.categoryIds.length > 0) {
      filtered = filtered.filter((item) => filters.category!.categoryIds!.includes(item.merchant.categoryId))
    }

    // Filtr kategorii po slug
    if (filters.category?.categorySlugs && filters.category.categorySlugs.length > 0) {
      filtered = filtered.filter((item) => filters.category!.categorySlugs!.includes(item.merchant.category?.slug))
    }

    // Filtr kategorii po nazwie
    if (filters.category?.categoryNames && filters.category.categoryNames.length > 0) {
      filtered = filtered.filter((item) =>
        filters.category!.categoryNames!.some((name) =>
          item.merchant.category?.name?.toLowerCase().includes(name.toLowerCase())
        )
      )
    }

    // Filtr miasta
    if (filters.search?.city) {
      filtered = filtered.filter((item) => item.store.city?.toLowerCase().includes(filters.search!.city!.toLowerCase()))
    }

    if (filters.search?.cities && filters.search.cities.length > 0) {
      filtered = filtered.filter((item) =>
        filters.search!.cities!.some((city) => item.store.city?.toLowerCase().includes(city.toLowerCase()))
      )
    }

    // Filtr odległości
    if (filters.location?.minDistanceKm !== undefined) {
      filtered = filtered.filter((item) => item.distanceKm >= filters.location!.minDistanceKm!)
    }

    if (filters.location?.maxDistanceKm !== undefined) {
      filtered = filtered.filter((item) => item.distanceKm <= filters.location!.maxDistanceKm!)
    }

    return filtered
  }

  private async applyCouponFilters(
    coupons: any[],
    filters: UnifiedSearchInput,
    userId: string | undefined,
    prisma: any
  ): Promise<any[]> {
    let filtered = [...coupons]

    // Filtr kategorii po ID
    if (filters.category?.categoryIds && filters.category.categoryIds.length > 0) {
      filtered = filtered.filter((item) => filters.category!.categoryIds!.includes(item.merchant.categoryId))
    }

    // Filtr kategorii po slug
    if (filters.category?.categorySlugs && filters.category.categorySlugs.length > 0) {
      filtered = filtered.filter((item) => filters.category!.categorySlugs!.includes(item.merchant.category?.slug))
    }

    // Filtr kategorii po nazwie
    if (filters.category?.categoryNames && filters.category.categoryNames.length > 0) {
      filtered = filtered.filter((item) =>
        filters.category!.categoryNames!.some((name) =>
          item.merchant.category?.name?.toLowerCase().includes(name.toLowerCase())
        )
      )
    }

    // Filtr punktów
    if (filters.points?.minPoints !== undefined) {
      filtered = filtered.filter((item) => (item.coupon.pointsCost || 0) >= filters.points!.minPoints!)
    }

    if (filters.points?.maxPoints !== undefined) {
      filtered = filtered.filter((item) => (item.coupon.pointsCost || 0) <= filters.points!.maxPoints!)
    }

    if (filters.points?.onlyFree) {
      filtered = filtered.filter((item) => !item.coupon.pointsCost || item.coupon.pointsCost === 0)
    }

    // Filtr typu wyświetlania
    if (filters.coupon?.displayTypes && filters.coupon.displayTypes.length > 0) {
      filtered = filtered.filter((item) => filters.coupon!.displayTypes!.includes(item.coupon.displayType))
    }

    // Filtr typu zniżki
    if (filters.coupon?.discountTypes && filters.coupon.discountTypes.length > 0) {
      filtered = filtered.filter((item) => filters.coupon!.discountTypes!.includes(item.coupon.discountType))
    }

    // Filtr daty wygaśnięcia
    if (filters.date?.expiringInDays !== undefined) {
      const expiryDate = new Date()
      expiryDate.setDate(expiryDate.getDate() + filters.date.expiringInDays)
      filtered = filtered.filter((item) => item.coupon.validUntil && new Date(item.coupon.validUntil) <= expiryDate)
    }

    // Filtr dostępności dla użytkownika (wystarczająco punktów)
    if (filters.coupon?.onlyAffordable && userId) {
      const userBalance = await prisma.userMerchantPointBalance.findMany({
        where: { userId },
      })
      const balanceMap = new Map(userBalance.map((b: any) => [b.merchantId, b.balance]))

      filtered = filtered.filter((item) => {
        const balance = balanceMap.get(item.merchant.id) || 0
        const cost = item.coupon.pointsCost || 0
        return cost === 0 || balance >= cost
      })
    }

    // Filtr niewykorzystanych
    if (filters.coupon?.onlyUnused && userId) {
      const usedCoupons = await prisma.userCoupon.findMany({
        where: { userId, isUsed: true },
        select: { couponId: true },
      })
      const usedCouponIds = new Set(usedCoupons.map((uc: any) => uc.couponId))
      filtered = filtered.filter((item) => !usedCouponIds.has(item.coupon.id))
    }

    // Filtr miasta
    if (filters.search?.city) {
      filtered = filtered.filter((item) => item.store.city?.toLowerCase().includes(filters.search!.city!.toLowerCase()))
    }

    // Filtr odległości
    if (filters.location?.minDistanceKm !== undefined) {
      filtered = filtered.filter((item) => item.distanceKm >= filters.location!.minDistanceKm!)
    }

    if (filters.location?.maxDistanceKm !== undefined) {
      filtered = filtered.filter((item) => item.distanceKm <= filters.location!.maxDistanceKm!)
    }

    return filtered
  }

  private applyStampCardFilters(stampCards: any[], filters: UnifiedSearchInput): any[] {
    let filtered = [...stampCards]

    // Filtr kategorii po ID
    if (filters.category?.categoryIds && filters.category.categoryIds.length > 0) {
      filtered = filtered.filter((item) => filters.category!.categoryIds!.includes(item.merchant.categoryId))
    }

    // Filtr kategorii po slug
    if (filters.category?.categorySlugs && filters.category.categorySlugs.length > 0) {
      filtered = filtered.filter((item) => filters.category!.categorySlugs!.includes(item.merchant.category?.slug))
    }

    // Filtr kategorii po nazwie
    if (filters.category?.categoryNames && filters.category.categoryNames.length > 0) {
      filtered = filtered.filter((item) =>
        filters.category!.categoryNames!.some((name) =>
          item.merchant.category?.name?.toLowerCase().includes(name.toLowerCase())
        )
      )
    }

    // Filtr liczby stempli
    if (filters.stampCard?.minStampsRequired !== undefined) {
      filtered = filtered.filter(
        (item) => item.stampCardProgress.stampsRequired >= filters.stampCard!.minStampsRequired!
      )
    }

    if (filters.stampCard?.maxStampsRequired !== undefined) {
      filtered = filtered.filter(
        (item) => item.stampCardProgress.stampsRequired <= filters.stampCard!.maxStampsRequired!
      )
    }

    // Filtr "blisko nagrody"
    if (filters.stampCard?.closeToReward) {
      filtered = filtered.filter((item) => {
        if (!item.stampCardProgress.hasCard) return false
        const collected = item.stampCardProgress.stampsCollected || 0
        const required = item.stampCardProgress.stampsRequired || 10
        const progress = collected / required
        return progress >= 0.7 // 70% lub więcej = blisko nagrody
      })
    }

    // Filtr miasta
    if (filters.search?.city) {
      filtered = filtered.filter((item) => item.store.city?.toLowerCase().includes(filters.search!.city!.toLowerCase()))
    }

    // Filtr odległości
    if (filters.location?.minDistanceKm !== undefined) {
      filtered = filtered.filter((item) => item.distanceKm >= filters.location!.minDistanceKm!)
    }

    if (filters.location?.maxDistanceKm !== undefined) {
      filtered = filtered.filter((item) => item.distanceKm <= filters.location!.maxDistanceKm!)
    }

    return filtered
  }

  private applyStreakStoreFilters(streakStores: any[], filters: UnifiedSearchInput): any[] {
    let filtered = [...streakStores]

    if (filters.category?.categoryIds && filters.category.categoryIds.length > 0) {
      filtered = filtered.filter((item) => filters.category!.categoryIds!.includes(item.merchant.categoryId))
    }

    if (filters.category?.categorySlugs && filters.category.categorySlugs.length > 0) {
      filtered = filtered.filter((item) => filters.category!.categorySlugs!.includes(item.merchant.category?.slug))
    }

    if (filters.search?.city) {
      filtered = filtered.filter((item) => item.store.city?.toLowerCase().includes(filters.search!.city!.toLowerCase()))
    }

    if (filters.location?.minDistanceKm !== undefined) {
      filtered = filtered.filter((item) => item.distanceKm >= filters.location!.minDistanceKm!)
    }

    if (filters.location?.maxDistanceKm !== undefined) {
      filtered = filtered.filter((item) => item.distanceKm <= filters.location!.maxDistanceKm!)
    }

    return filtered
  }

  private async generateMetadata(
    filters: UnifiedSearchInput,
    allStores: any[],
    allCoupons: any[],
    allStampCards: any[],
    filteredStores: any[],
    filteredCoupons: any[],
    filteredStampCards: any[],
    latitude: number,
    longitude: number
  ): Promise<FilterMetadata> {
    // Zbierz kategorie ze wszystkich źródeł
    const categoryMap = new Map<string, { name: string; slug: string; count: number }>()

    allStores.forEach((item: any) => {
      const cat = item.merchant.category
      if (cat) {
        const existing = categoryMap.get(cat.id) || { name: cat.name, slug: cat.slug, count: 0 }
        existing.count++
        categoryMap.set(cat.id, existing)
      }
    })

    allCoupons.forEach((item: any) => {
      const cat = item.merchant.category
      if (cat) {
        const existing = categoryMap.get(cat.id) || { name: cat.name, slug: cat.slug, count: 0 }
        existing.count++
        categoryMap.set(cat.id, existing)
      }
    })

    const availableCategories = Array.from(categoryMap.entries()).map(([id, data]) => ({
      id,
      name: data.name,
      slug: data.slug,
      count: data.count,
    }))

    // Zbierz miasta
    const cityMap = new Map<string, number>()
    allStores.forEach((item: any) => {
      if (item.store.city) {
        cityMap.set(item.store.city, (cityMap.get(item.store.city) || 0) + 1)
      }
    })

    const availableCities = Array.from(cityMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)

    // Zakres punktów
    const pointsValues = allCoupons.map((item: any) => item.coupon.pointsCost || 0)
    const pointsRange = {
      min: pointsValues.length > 0 ? Math.min(...pointsValues) : 0,
      max: pointsValues.length > 0 ? Math.max(...pointsValues) : 0,
      freeCount: allCoupons.filter((item: any) => !item.coupon.pointsCost || item.coupon.pointsCost === 0).length,
    }

    // Zakres odległości
    const distances = [...allStores, ...allCoupons, ...allStampCards].map((item: any) => item.distanceKm)
    const distanceRange =
      distances.length > 0
        ? {
            min: Math.min(...distances),
            max: Math.max(...distances),
            average: distances.reduce((a, b) => a + b, 0) / distances.length,
          }
        : undefined

    // Typy wyświetlania
    const displayTypes = [...new Set(allCoupons.map((item: any) => item.coupon.displayType).filter(Boolean))]

    // Typy zniżek
    const discountTypes = [...new Set(allCoupons.map((item: any) => item.coupon.discountType).filter(Boolean))]

    return {
      availableCategories,
      availableCities,
      pointsRange,
      distanceRange,
      availableSortOptions: [
        SearchSortOrder.DISTANCE,
        SearchSortOrder.ALPHABETICAL,
        SearchSortOrder.ALPHABETICAL_DESC,
        SearchSortOrder.PRIORITY,
        SearchSortOrder.NEWEST,
        SearchSortOrder.OLDEST,
        SearchSortOrder.POINTS_ASC,
        SearchSortOrder.POINTS_DESC,
        SearchSortOrder.EXPIRING_SOON,
        SearchSortOrder.POPULARITY,
      ],
      availableDisplayTypes: displayTypes,
      availableDiscountTypes: discountTypes,
      appliedFilters: {
        sortBy: filters.sort?.sortBy || SearchSortOrder.DISTANCE,
        categoryIds: filters.category?.categoryIds,
        radiusKm: filters.location?.radiusKm,
        minPoints: filters.points?.minPoints,
        maxPoints: filters.points?.maxPoints,
        city: filters.search?.city,
        searchText: filters.search?.searchText,
        displayTypes: filters.coupon?.displayTypes,
        onlyFree: filters.points?.onlyFree,
        onlyAffordable: filters.coupon?.onlyAffordable,
      },
      totalResults: allStores.length + allCoupons.length + allStampCards.length,
      filteredResults: filteredStores.length + filteredCoupons.length + filteredStampCards.length,
      hasUserLocation: !!(latitude && longitude),
    }
  }
}
