import { InputType, Field, Float } from 'type-graphql'

@InputType()
export class LocationSearchInput {
  @Field(() => Float, { nullable: true })
  latitude?: number

  @Field(() => Float, { nullable: true })
  longitude?: number

  @Field(() => Float, { nullable: true, defaultValue: 10 })
  radiusKm?: number

  @Field(() => String, { nullable: true })
  searchText?: string
}

@InputType()
export class FallbackLocationInput {
  @Field(() => String, { nullable: true })
  ipAddress?: string

  @Field(() => String, { nullable: true })
  userAgent?: string

  @Field(() => String, { nullable: true })
  timezone?: string

  @Field(() => String, { nullable: true })
  language?: string
}
