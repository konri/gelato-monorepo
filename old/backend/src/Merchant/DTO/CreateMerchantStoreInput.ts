import 'reflect-metadata'
import { InputType, Field, Float } from 'type-graphql'

@InputType()
export class CreateMerchantStoreInput {
  @Field()
  name!: string

  @Field()
  address!: string

  @Field()
  city!: string

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
}
