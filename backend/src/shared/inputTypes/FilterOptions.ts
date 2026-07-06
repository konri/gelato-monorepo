import { InputType, Field, Float, Int } from 'type-graphql'
import { SearchSortOrder } from '../enums/SortOrder'

@InputType()
export class LocationFilter {
  @Field(() => Float, { nullable: true })
  latitude?: number

  @Field(() => Float, { nullable: true })
  longitude?: number

  @Field(() => Float, { nullable: true, defaultValue: 10, description: 'Promień wyszukiwania w kilometrach' })
  radiusKm?: number

  @Field(() => Float, { nullable: true, description: 'Minimalna odległość w km' })
  minDistanceKm?: number

  @Field(() => Float, { nullable: true, description: 'Maksymalna odległość w km' })
  maxDistanceKm?: number
}

@InputType()
export class CategoryFilter {
  @Field(() => [String], { nullable: true, description: 'Lista ID kategorii do filtrowania' })
  categoryIds?: string[]

  @Field(() => [String], { nullable: true, description: 'Lista slugów kategorii' })
  categorySlugs?: string[]

  @Field(() => [String], { nullable: true, description: 'Lista nazw kategorii' })
  categoryNames?: string[]
}

@InputType()
export class PointsFilter {
  @Field(() => Int, { nullable: true, description: 'Minimalna liczba punktów' })
  minPoints?: number

  @Field(() => Int, { nullable: true, description: 'Maksymalna liczba punktów' })
  maxPoints?: number

  @Field(() => Boolean, { nullable: true, description: 'Tylko darmowe (0 punktów)' })
  onlyFree?: boolean
}

@InputType()
export class DateFilter {
  @Field(() => Date, { nullable: true, description: 'Data od' })
  validFrom?: Date

  @Field(() => Date, { nullable: true, description: 'Data do' })
  validUntil?: Date

  @Field(() => Int, { nullable: true, description: 'Wygasające w ciągu X dni' })
  expiringInDays?: number
}

@InputType()
export class StampCardFilter {
  @Field(() => Boolean, { nullable: true, description: 'Tylko karty z aktywnymi programami' })
  onlyActive?: boolean

  @Field(() => Int, { nullable: true, description: 'Minimalna liczba stempli wymagana' })
  minStampsRequired?: number

  @Field(() => Int, { nullable: true, description: 'Maksymalna liczba stempli wymagana' })
  maxStampsRequired?: number

  @Field(() => Boolean, { nullable: true, description: 'Tylko karty z milestone rewards' })
  hasMilestones?: boolean

  @Field(() => Boolean, { nullable: true, description: 'Tylko karty gdzie użytkownik jest blisko nagrody' })
  closeToReward?: boolean
}

@InputType()
export class CouponFilter {
  @Field(() => [String], { nullable: true, description: 'Typy wyświetlania (HOT, PROMOTED, STANDARD)' })
  displayTypes?: string[]

  @Field(() => [String], { nullable: true, description: 'Typy kuponów' })
  couponTypes?: string[]

  @Field(() => [String], { nullable: true, description: 'Typy zniżek (PERCENT, AMOUNT, FREE)' })
  discountTypes?: string[]

  @Field(() => Boolean, { nullable: true, description: 'Tylko niewykorzystane przez użytkownika' })
  onlyUnused?: boolean

  @Field(() => Boolean, { nullable: true, description: 'Tylko dostępne dla użytkownika (wystarczająco punktów)' })
  onlyAffordable?: boolean
}

@InputType()
export class SearchFilter {
  @Field(() => String, { nullable: true, description: 'Wyszukiwanie tekstowe' })
  searchText?: string

  @Field(() => String, { nullable: true, description: 'Miasto' })
  city?: string

  @Field(() => [String], { nullable: true, description: 'Lista miast' })
  cities?: string[]

  @Field(() => Boolean, {
    nullable: true,
    description: 'Tylko nagrody gdzie user ma aktywność (pieczątki, punkty, streak, kupony)',
  })
  onlyUserActive?: boolean
}

@InputType()
export class PaginationInput {
  @Field(() => Int, { nullable: true, defaultValue: 1, description: 'Numer strony' })
  page?: number

  @Field(() => Int, { nullable: true, defaultValue: 20, description: 'Liczba wyników na stronę' })
  pageSize?: number

  @Field(() => Int, { nullable: true, description: 'Pomiń X wyników' })
  skip?: number

  @Field(() => Int, { nullable: true, description: 'Pobierz X wyników' })
  take?: number
}

@InputType()
export class SortInput {
  @Field(() => SearchSortOrder, {
    nullable: true,
    defaultValue: SearchSortOrder.DISTANCE,
    description: 'Sposób sortowania',
  })
  sortBy?: SearchSortOrder

  @Field(() => Boolean, { nullable: true, defaultValue: false, description: 'Odwróć kolejność sortowania' })
  reverse?: boolean
}
