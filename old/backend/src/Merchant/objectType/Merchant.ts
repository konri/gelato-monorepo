import 'reflect-metadata'
import { ObjectType, Field, ID } from 'type-graphql'
import { Category } from './Category'
import { MerchantStore } from './MerchantStore'
import { MerchantVoucher } from './MerchantVoucher'
import { Company } from '../../CompanyOwner/objectType/Comapny'
import { StreakProgram } from '../../Streak/objectType/StreakProgram'

@ObjectType()
export class Merchant {
  @Field(() => ID)
  id: string

  @Field(() => String)
  name: string

  @Field(() => String)
  slug: string

  @Field(() => String, { nullable: true })
  description?: string

  @Field(() => String, { nullable: true })
  logoUrl?: string

  @Field(() => String, { nullable: true })
  coverUrl?: string

  @Field(() => String, { nullable: true })
  iconUrl?: string

  @Field(() => Category)
  category: Category

  @Field(() => String)
  categoryId: string

  @Field(() => Company, { nullable: true })
  company?: Company

  @Field(() => String, { nullable: true })
  companyId?: string

  @Field(() => Boolean)
  isVerified: boolean

  @Field(() => Date, { nullable: true })
  verifiedAt?: Date

  @Field(() => String, { nullable: true })
  verifiedBy?: string

  @Field(() => [MerchantStore])
  stores: MerchantStore[]

  @Field(() => [MerchantVoucher])
  vouchers: MerchantVoucher[]

  @Field(() => [StreakProgram], { nullable: true })
  streakPrograms?: StreakProgram[]

  @Field(() => Boolean)
  isActive: boolean

  @Field(() => Number)
  rewardProximityThreshold: number

  @Field(() => Number)
  stampProximityThreshold: number

  @Field(() => Date)
  createdAt: Date

  @Field(() => Date)
  updatedAt: Date
}
