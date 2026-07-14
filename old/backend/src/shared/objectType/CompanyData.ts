import { ObjectType, Field } from 'type-graphql'

@ObjectType()
export class CompanyData {
  @Field()
  nip: string

  @Field()
  name: string

  @Field({ nullable: true })
  regon?: string

  @Field({ nullable: true })
  krs?: string

  @Field()
  address: string

  @Field()
  city: string

  @Field()
  postalCode: string

  @Field(() => [String], { nullable: true })
  accountNumbers?: string[]

  @Field()
  hasVirtualAccounts: boolean

  @Field({ nullable: true })
  registrationLegalDate?: string

  @Field({ nullable: true })
  registrationDenialDate?: string

  @Field({ nullable: true })
  registrationDenialBasis?: string

  @Field({ nullable: true })
  restorationDate?: string

  @Field({ nullable: true })
  restorationBasis?: string

  @Field({ nullable: true })
  removalDate?: string

  @Field({ nullable: true })
  removalBasis?: string
}
