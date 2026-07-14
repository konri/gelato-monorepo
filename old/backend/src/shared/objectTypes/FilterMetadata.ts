import { ObjectType, Field, Int } from 'type-graphql'
import { SearchSortOrder } from '../enums/SortOrder'

@ObjectType()
export class AvailableFilter {
  @Field(() => String)
  key: string

  @Field(() => String)
  label: string

  @Field(() => String)
  type: string // 'range', 'select', 'boolean', 'multiselect'

  @Field(() => [String], { nullable: true })
  options?: string[]

  @Field(() => String, { nullable: true })
  description?: string
}

@ObjectType()
export class CategoryOption {
  @Field(() => String)
  id: string

  @Field(() => String)
  name: string

  @Field(() => String)
  slug: string

  @Field(() => Int)
  count: number // Liczba wyników w tej kategorii
}

@ObjectType()
export class CityOption {
  @Field(() => String)
  name: string

  @Field(() => Int)
  count: number
}

@ObjectType()
export class PointsRange {
  @Field(() => Int)
  min: number

  @Field(() => Int)
  max: number

  @Field(() => Int)
  freeCount: number // Liczba darmowych ofert
}

@ObjectType()
export class DistanceRange {
  @Field(() => Number)
  min: number

  @Field(() => Number)
  max: number

  @Field(() => Number)
  average: number
}

@ObjectType()
export class AppliedFilters {
  @Field(() => String, { nullable: true })
  sortBy?: string

  @Field(() => [String], { nullable: true })
  categoryIds?: string[]

  @Field(() => Number, { nullable: true })
  radiusKm?: number

  @Field(() => Int, { nullable: true })
  minPoints?: number

  @Field(() => Int, { nullable: true })
  maxPoints?: number

  @Field(() => String, { nullable: true })
  city?: string

  @Field(() => String, { nullable: true })
  searchText?: string

  @Field(() => [String], { nullable: true })
  displayTypes?: string[]

  @Field(() => Boolean, { nullable: true })
  onlyFree?: boolean

  @Field(() => Boolean, { nullable: true })
  onlyAffordable?: boolean
}

@ObjectType()
export class FilterMetadata {
  @Field(() => [CategoryOption])
  availableCategories: CategoryOption[]

  @Field(() => [CityOption])
  availableCities: CityOption[]

  @Field(() => PointsRange, { nullable: true })
  pointsRange?: PointsRange

  @Field(() => DistanceRange, { nullable: true })
  distanceRange?: DistanceRange

  @Field(() => [String])
  availableSortOptions: string[]

  @Field(() => [String], { nullable: true })
  availableDisplayTypes?: string[]

  @Field(() => [String], { nullable: true })
  availableDiscountTypes?: string[]

  @Field(() => AppliedFilters)
  appliedFilters: AppliedFilters

  @Field(() => Int)
  totalResults: number

  @Field(() => Int)
  filteredResults: number

  @Field(() => Boolean)
  hasUserLocation: boolean
}
