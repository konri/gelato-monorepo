import 'reflect-metadata'
import { InputType, Field, Float } from 'type-graphql'

@InputType()
export class UpdateMerchantStoreInput {
  @Field({ nullable: true })
  name?: string

  @Field({ nullable: true })
  address?: string

  @Field({ nullable: true })
  city?: string

  @Field({ nullable: true })
  phone?: string

  @Field({ nullable: true })
  logoUrl?: string

  @Field({ nullable: true })
  photoUrl?: string

  @Field(() => Float, { nullable: true })
  latitude?: number

  @Field(() => Float, { nullable: true })
  longitude?: number

  @Field({ nullable: true })
  isActive?: boolean
}
