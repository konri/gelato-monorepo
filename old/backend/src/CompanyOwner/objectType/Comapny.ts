import { ObjectType, Field, ID, Authorized } from 'type-graphql'
import { Role } from '../../User/objectType/Role'
import { CompanyOwner } from './CompanyOwner'
import { UploadedFile } from '../../Upload/UploadedFile'
import { SubscriptionCompany } from '../../Subscription/objectType/SubscriptionCompany'

@ObjectType()
export class Company {
  @Field(() => ID)
  id: string

  @Field(() => String)
  name: string

  @Field(() => String)
  description: string

  @Field(() => String, { nullable: true })
  taxId?: string

  @Field(() => UploadedFile, { nullable: true })
  logo?: UploadedFile

  @Field(() => String)
  address: string

  @Field(() => String)
  city: string

  @Field(() => String, { nullable: true })
  postalCode?: string

  @Field(() => String)
  country: string

  @Field(() => [String])
  cityOperate: string[]

  @Field(() => String, { nullable: true })
  phone: string

  @Field(() => String, { nullable: true })
  email: string

  @Field(() => String, { nullable: true })
  website: string

  @Field(() => String, { nullable: true })
  facebook: string

  @Field(() => String, { nullable: true })
  instagram: string

  @Field(() => String, { nullable: true })
  tiktok: string

  @Field(() => CompanyOwner)
  companyOwner: CompanyOwner

  @Field(() => SubscriptionCompany)
  subscription: SubscriptionCompany

  @Field()
  createdAt: Date

  @Authorized(Role.ADMIN)
  @Field()
  updatedAt: Date
}
