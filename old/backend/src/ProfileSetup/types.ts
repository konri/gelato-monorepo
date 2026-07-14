import { ObjectType, Field, InputType, registerEnumType } from 'type-graphql'
import GraphQLJSON from 'graphql-type-json'

export enum ProfileSetupStep {
  COMPANY = 'COMPANY',
  MERCHANT = 'MERCHANT',
  STORE = 'STORE',
  SUBSCRIPTION = 'SUBSCRIPTION',
  COMPLETED = 'COMPLETED',
}

registerEnumType(ProfileSetupStep, {
  name: 'ProfileSetupStep',
})

@ObjectType()
export class ProfileSetupStatus {
  @Field(() => ProfileSetupStep)
  currentStep: ProfileSetupStep

  @Field(() => [ProfileSetupStep])
  completedSteps: ProfileSetupStep[]

  @Field()
  isCompleted: boolean

  @Field()
  hasCompany: boolean

  @Field()
  hasMerchant: boolean

  @Field()
  hasStore: boolean

  @Field()
  hasSubscription: boolean

  @Field(() => GraphQLJSON, { nullable: true })
  companyDraft?: any

  @Field(() => GraphQLJSON, { nullable: true })
  merchantDraft?: any

  @Field(() => GraphQLJSON, { nullable: true })
  storeDraft?: any
}

@InputType()
export class SaveFormDraftInput {
  @Field()
  formType: string

  @Field(() => GraphQLJSON)
  formData: any

  @Field(() => ProfileSetupStep, { nullable: true })
  step?: ProfileSetupStep
}
