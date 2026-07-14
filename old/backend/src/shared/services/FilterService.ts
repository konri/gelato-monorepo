import { PrismaClient } from '@prisma/client'
import { UnifiedSearchInput } from '../inputTypes/UnifiedSearchInput'
import {
  FilterMetadata,
  CategoryOption,
  CityOption,
  PointsRange,
  DistanceRange,
  AppliedFilters,
} from '../objectTypes/FilterMetadata'
import { SearchSortOrder } from '../enums/SortOrder'

export class FilterService {
  private prisma: PrismaClient

  constructor(prisma: PrismaClient) {
    this.prisma = prisma
  }

  async getCouponFilterMetadata(filters: UnifiedSearchInput, userId?: string): Promise<FilterMetadata> {
    const baseWhere: any = {
      isActive: true,
      validUntil: { gte: new Date() },
    }

    const allCoupons = await this.prisma.coupon.findMany({
      where: baseWhere,
      include: {
        merchant: {
          include: {
            category: true,
            stores: {
              where: { isActive: true },
            },
          },
        },
      },
    })

    const categoryMap = new Map<string, { name: string; slug: string; count: number }>()
    allCoupons.forEach((coupon) => {
      const cat = coupon.merchant.category
      if (cat) {
        const existing = categoryMap.get(cat.id) || { name: cat.name, slug: cat.slug, count: 0 }
        existing.count++
        categoryMap.set(cat.id, existing)
      }
    })

    const availableCategories: CategoryOption[] = Array.from(categoryMap.entries()).map(([id, data]) => ({
      id,
      name: data.name,
      slug: data.slug,
      count: data.count,
    }))

    const cityMap = new Map<string, number>()
    allCoupons.forEach((coupon) => {
      coupon.merchant.stores.forEach((store) => {
        if (store.city) {
          cityMap.set(store.city, (cityMap.get(store.city) || 0) + 1)
        }
      })
    })

    const availableCities: CityOption[] = Array.from(cityMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)

    const pointsValues = allCoupons.map((c) => c.pointsCost || 0).filter((p) => p !== null)
    const pointsRange: PointsRange = {
      min: pointsValues.length > 0 ? Math.min(...pointsValues) : 0,
      max: pointsValues.length > 0 ? Math.max(...pointsValues) : 0,
      freeCount: allCoupons.filter((c) => !c.pointsCost || c.pointsCost === 0).length,
    }

    const displayTypes = [...new Set(allCoupons.map((c) => c.displayType).filter(Boolean))] as string[]

    const discountTypes = [...new Set(allCoupons.map((c) => c.discountType).filter(Boolean))] as string[]

    const appliedFilters: AppliedFilters = {
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
    }

    return {
      availableCategories,
      availableCities,
      pointsRange,
      distanceRange: undefined,
      availableSortOptions: this.getAvailableSortOptions('coupon'),
      availableDisplayTypes: displayTypes,
      availableDiscountTypes: discountTypes,
      appliedFilters,
      totalResults: allCoupons.length,
      filteredResults: allCoupons.length,
      hasUserLocation: !!(filters.location?.latitude && filters.location?.longitude),
    }
  }

  async getStoreFilterMetadata(filters: UnifiedSearchInput, userId?: string): Promise<FilterMetadata> {
    const baseWhere: any = {
      isActive: true,
      latitude: { not: null },
      longitude: { not: null },
    }

    const allStores = await this.prisma.merchantStore.findMany({
      where: baseWhere,
      include: {
        merchant: {
          include: {
            category: true,
          },
        },
      },
    })

    // Kategorie
    const categoryMap = new Map<string, { name: string; slug: string; count: number }>()
    allStores.forEach((store) => {
      const cat = store.merchant.category
      if (cat) {
        const existing = categoryMap.get(cat.id) || { name: cat.name, slug: cat.slug, count: 0 }
        existing.count++
        categoryMap.set(cat.id, existing)
      }
    })

    const availableCategories: CategoryOption[] = Array.from(categoryMap.entries()).map(([id, data]) => ({
      id,
      name: data.name,
      slug: data.slug,
      count: data.count,
    }))

    // Miasta
    const cityMap = new Map<string, number>()
    allStores.forEach((store) => {
      if (store.city) {
        cityMap.set(store.city, (cityMap.get(store.city) || 0) + 1)
      }
    })

    const availableCities: CityOption[] = Array.from(cityMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)

    const appliedFilters: AppliedFilters = {
      sortBy: filters.sort?.sortBy || SearchSortOrder.DISTANCE,
      categoryIds: filters.category?.categoryIds,
      radiusKm: filters.location?.radiusKm,
      city: filters.search?.city,
      searchText: filters.search?.searchText,
    }

    return {
      availableCategories,
      availableCities,
      pointsRange: undefined,
      distanceRange: undefined,
      availableSortOptions: this.getAvailableSortOptions('store'),
      appliedFilters,
      totalResults: allStores.length,
      filteredResults: allStores.length,
      hasUserLocation: !!(filters.location?.latitude && filters.location?.longitude),
    }
  }

  async getStampCardFilterMetadata(filters: UnifiedSearchInput, userId?: string): Promise<FilterMetadata> {
    const baseWhere: any = {
      isActive: true,
    }

    const allTemplates = await this.prisma.loyaltyStampCardTemplate.findMany({
      where: baseWhere,
      include: {
        merchant: {
          include: {
            category: true,
            stores: {
              where: { isActive: true },
            },
          },
        },
        milestones: true,
      },
    })

    // Kategorie
    const categoryMap = new Map<string, { name: string; slug: string; count: number }>()
    allTemplates.forEach((template) => {
      const cat = template.merchant.category
      if (cat) {
        const existing = categoryMap.get(cat.id) || { name: cat.name, slug: cat.slug, count: 0 }
        existing.count++
        categoryMap.set(cat.id, existing)
      }
    })

    const availableCategories: CategoryOption[] = Array.from(categoryMap.entries()).map(([id, data]) => ({
      id,
      name: data.name,
      slug: data.slug,
      count: data.count,
    }))

    // Miasta
    const cityMap = new Map<string, number>()
    allTemplates.forEach((template) => {
      template.merchant.stores.forEach((store) => {
        if (store.city) {
          cityMap.set(store.city, (cityMap.get(store.city) || 0) + 1)
        }
      })
    })

    const availableCities: CityOption[] = Array.from(cityMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)

    const appliedFilters: AppliedFilters = {
      sortBy: filters.sort?.sortBy || SearchSortOrder.DISTANCE,
      categoryIds: filters.category?.categoryIds,
      radiusKm: filters.location?.radiusKm,
      city: filters.search?.city,
      searchText: filters.search?.searchText,
    }

    return {
      availableCategories,
      availableCities,
      pointsRange: undefined,
      distanceRange: undefined,
      availableSortOptions: this.getAvailableSortOptions('stampCard'),
      appliedFilters,
      totalResults: allTemplates.length,
      filteredResults: allTemplates.length,
      hasUserLocation: !!(filters.location?.latitude && filters.location?.longitude),
    }
  }

  private getAvailableSortOptions(entityType: 'coupon' | 'store' | 'stampCard'): string[] {
    const common = [
      SearchSortOrder.DISTANCE,
      SearchSortOrder.ALPHABETICAL,
      SearchSortOrder.ALPHABETICAL_DESC,
      SearchSortOrder.NEWEST,
      SearchSortOrder.OLDEST,
    ]

    if (entityType === 'coupon') {
      return [
        ...common,
        SearchSortOrder.PRIORITY,
        SearchSortOrder.POINTS_ASC,
        SearchSortOrder.POINTS_DESC,
        SearchSortOrder.EXPIRING_SOON,
        SearchSortOrder.POPULARITY,
      ]
    }

    if (entityType === 'stampCard') {
      return [...common, SearchSortOrder.POPULARITY]
    }

    return common
  }
}
