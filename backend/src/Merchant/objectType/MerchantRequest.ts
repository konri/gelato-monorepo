import { ObjectType, Field, ID } from 'type-graphql'
import { Company } from '../../CompanyOwner/objectType/Comapny'
import { Category } from './Category'

export enum MerchantRequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

@ObjectType()
export class MerchantRequest {
  @Field(() => ID)
  id: string

  @Field()
  name: string

  @Field({ nullable: true })
  description?: string

  @Field(() => Category)
  category: Category

  @Field()
  categoryId: string

  @Field({ nullable: true })
  logoUrl?: string

  @Field({ nullable: true })
  coverUrl?: string

  @Field({ nullable: true })
  iconUrl?: string

  @Field(() => Company)
  company: Company

  @Field()
  companyId: string

  @Field({ nullable: true })
  merchantId?: string

  @Field()
  status: MerchantRequestStatus

  @Field({ nullable: true })
  rejectionReason?: string

  @Field()
  createdAt: Date

  @Field()
  updatedAt: Date
}
