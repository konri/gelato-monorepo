import { InputType, Field } from 'type-graphql'
import {
  LocationFilter,
  CategoryFilter,
  PointsFilter,
  DateFilter,
  StampCardFilter,
  CouponFilter,
  SearchFilter,
  PaginationInput,
  SortInput,
} from './FilterOptions'

@InputType()
export class UnifiedSearchInput {
  @Field(() => LocationFilter, { nullable: true })
  location?: LocationFilter

  @Field(() => CategoryFilter, { nullable: true })
  category?: CategoryFilter

  @Field(() => PointsFilter, { nullable: true })
  points?: PointsFilter

  @Field(() => DateFilter, { nullable: true })
  date?: DateFilter

  @Field(() => StampCardFilter, { nullable: true })
  stampCard?: StampCardFilter

  @Field(() => CouponFilter, { nullable: true })
  coupon?: CouponFilter

  @Field(() => SearchFilter, { nullable: true })
  search?: SearchFilter

  @Field(() => PaginationInput, { nullable: true })
  pagination?: PaginationInput

  @Field(() => SortInput, { nullable: true })
  sort?: SortInput
}
